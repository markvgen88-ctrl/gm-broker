import { pool, isDatabaseConfigured } from "./pool.js";

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
    `);
    console.log("[db] Схема CRM проверена/создана.");
  } catch (err) {
    console.error("[db] Не удалось создать/проверить схему CRM:", err);
  }
}
