import { Pool } from "pg";

/**
 * Пул подключений к базе заявок (CRM). Рассчитан на внешний managed Postgres
 * (Neon, Supabase и т.п.) — они требуют SSL, но обычно с самоподписанной
 * цепочкой промежуточных сертификатов, поэтому rejectUnauthorized: false —
 * стандартная и безопасная практика для таких провайдеров (соединение всё
 * равно зашифровано, просто не проверяется полная цепочка доверия).
 *
 * Если DATABASE_URL не задан, пул создаётся, но подключение произойдёт
 * только при первом реальном запросе — тогда и появится понятная ошибка
 * в логах. Это сделано намеренно: сайт должен продолжать работать (приём
 * анкет через Telegram/Email/Sheets) даже если CRM ещё не настроена.
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
  max: 5,
});

pool.on("error", (err) => {
  // Ошибки на уже установленных, но простаивающих соединениях не должны
  // ронять процесс — просто логируем.
  console.error("[db] Неожиданная ошибка пула соединений:", err);
});

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
