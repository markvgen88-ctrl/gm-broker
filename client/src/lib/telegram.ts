/**
 * Telegram-ник клиента: принимаем «@username», «username» и ссылки вида
 * «t.me/username». Возвращает «@username», пустую строку (поле не заполнено)
 * или null, если значение не похоже на ник Telegram. Правила те же, что на
 * сервере (server/src/lib/telegram.ts).
 */
const USERNAME_REGEX = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;

export function normalizeTelegram(raw: string): string | null {
  let v = raw.trim();
  if (v === "") return "";
  v = v.replace(/^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\//i, "");
  v = v.replace(/^@/, "").replace(/[/?#].*$/, "");
  return USERNAME_REGEX.test(v) ? `@${v}` : null;
}

export const TELEGRAM_ERROR = "Укажите ник Telegram в формате @username или ссылку t.me/…";
