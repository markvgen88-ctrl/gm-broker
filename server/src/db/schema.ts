import { pool, isDatabaseConfigured } from "./pool.js";
import { seedEmailDefaults } from "./emailTemplates.js";

/**
 * Создаёт таблицы CRM при старте сервера, если их ещё нет. Не требует
 * отдельного шага миграции — достаточно один раз указать DATABASE_URL.
 * Безопасно вызывать при каждом запуске (IF NOT EXISTS).
 */
export async function ensureSchema(): Promise<void> {
  if (!isDatabaseConfigured()) {
    console.warn("⚠️  DATABASE_URL не задан — CRM (/admin) не будет работать, приём заявок при этом не затронут.");
    return;
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        submitted_at TIMESTAMPTZ NOT NULL,
        client_type TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        loan_amount TEXT,
        answers JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'new'
      );

      CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status);
      CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications (created_at DESC);

      CREATE TABLE IF NOT EXISTS application_comments (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_comments_application_id ON application_comments (application_id);

      -- Заявки на услуги с форм на страницах услуг (заморозка кредита,
      -- банкротство и др.). Таблица называется freeze_requests исторически —
      -- раньше здесь были только заявки на заморозку; услуга — в колонке service.
      CREATE TABLE IF NOT EXISTS freeze_requests (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        comment TEXT
      );
      -- Старые заявки (до появления колонки) — это заявки на заморозку.
      ALTER TABLE freeze_requests
        ADD COLUMN IF NOT EXISTS service TEXT NOT NULL DEFAULT 'zamorozka-kreditnogo-dogovora';
      ALTER TABLE freeze_requests
        ADD COLUMN IF NOT EXISTS telegram TEXT;

      -- Заявки по услугам ведутся в CRM (раздел «Услуги») отдельно от анкет
      -- на кредитование: свой статус и свои комментарии. Статус по умолчанию
      -- совпадает с DEFAULT_STATUS в lib/statuses.ts; у уже существующих
      -- заявок он тоже станет «Новая заявка».
      ALTER TABLE freeze_requests
        ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Новая заявка';
      ALTER TABLE freeze_requests
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

      CREATE TABLE IF NOT EXISTS service_request_comments (
        id SERIAL PRIMARY KEY,
        request_id INTEGER NOT NULL REFERENCES freeze_requests (id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_service_request_comments_request_id
        ON service_request_comments (request_id);

      -- Сквозной счётчик номеров договора. Стартовое значение 1492 — это
      -- последний номер, реально выданный старым Telegram-ботом (до
      -- переноса генерации договоров на сайт), следующий выданный здесь
      -- будет 1493. Если этот счётчик когда-нибудь понадобится сдвинуть
      -- вручную — просто обновите last_num напрямую в базе.
      CREATE TABLE IF NOT EXISTS contract_counter (
        id INTEGER PRIMARY KEY,
        last_num INTEGER NOT NULL
      );
      INSERT INTO contract_counter (id, last_num) VALUES (1, 1492) ON CONFLICT (id) DO NOTHING;

      CREATE TABLE IF NOT EXISTS contracts (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
        contract_num INTEGER NOT NULL,
        client_type TEXT NOT NULL,
        client_name TEXT NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_contracts_application_id ON contracts (application_id);

      -- Письма клиенту, отправленные из карточки заявки. Сами файлы-вложения
      -- не хранятся — только их названия и размеры.
      CREATE TABLE IF NOT EXISTS application_messages (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
        to_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_application_messages_application_id
        ON application_messages (application_id);

      -- Шаблоны писем клиенту и общие настройки писем (подпись). Редактируются в CRM.
      CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        label TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS email_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      -- Настройки опроса на сайте (минимальная сумма кредита и т. п.), редактируются в CRM.
      CREATE TABLE IF NOT EXISTS survey_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    await seedEmailDefaults();
    console.log("[db] Схема CRM проверена/создана.");
  } catch (err) {
    console.error("[db] Не удалось создать/проверить схему CRM:", err);
  }
}
