interface TelegramSendResult {
  ok: boolean;
  error?: string;
}

/**
 * Отправляет сообщение через Telegram Bot API.
 * Требует переменные окружения TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID.
 *
 * Как получить TELEGRAM_CHAT_ID — см. README.md в корне проекта:
 * коротко — напишите вашему боту любое сообщение, затем откройте
 * https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates и найдите поле "chat":{"id":...}.
 */
export async function sendTelegramMessage(text: string): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return { ok: false, error: "TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не настроены на сервере" };
  }

  // Telegram ограничивает длину сообщения 4096 символами
  const MAX_LENGTH = 4000;
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, MAX_LENGTH));
    remaining = remaining.slice(MAX_LENGTH);
  }

  try {
    for (const chunk of chunks) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      let response: Response;
      try {
        response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: chunk,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        const body = await response.text();
        return { ok: false, error: `Telegram API вернул ошибку: ${response.status} ${body}` };
      }
    }
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, error: "Telegram API не ответил вовремя (таймаут)" };
    }
    return { ok: false, error: error instanceof Error ? error.message : "Неизвестная ошибка Telegram API" };
  }
}
