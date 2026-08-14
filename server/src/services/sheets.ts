import type { SubmissionInput } from "../lib/validation.js";

interface SheetsSendResult {
  ok: boolean;
  error?: string;
}

/**
 * Резервный канал доставки заявок — пишет строку в Google Таблицу через
 * Google Apps Script Web App (бесплатно, без отдельной БД).
 *
 * Зачем: Telegram и Email — оба внешние сервисы, которые время от времени
 * могут быть недоступны (упавший SMTP, лимит Telegram API и т.д.). Раньше
 * при сбое единственного канала заявка терялась без следа. Теперь заявка
 * параллельно уходит в третье, полностью независимое место — так что чтобы
 * потерять лид, должны отказать все три канала одновременно.
 *
 * Настройка (см. server/GOOGLE_SHEETS_SETUP.md):
 *   1. Создать Google Таблицу и Apps Script Web App поверх неё.
 *   2. Задать переменные окружения GOOGLE_SHEETS_WEBHOOK_URL и
 *      GOOGLE_SHEETS_WEBHOOK_SECRET.
 * Если переменные не заданы — канал просто не активен (не ошибка сама по
 * себе, но тогда резервной копии у заявок нет).
 */
export async function sendSheetsBackup(input: SubmissionInput): Promise<SheetsSendResult> {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const secret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;

  if (!webhookUrl) {
    return { ok: false, error: "GOOGLE_SHEETS_WEBHOOK_URL не настроен на сервере" };
  }

  const { answers, clientType, submittedAt } = input;

  const payload = {
    secret: secret ?? "",
    submittedAt,
    clientType,
    name: String(answers.name ?? ""),
    contactInfo: String(answers.contactInfo ?? ""),
    loanAmount: answers.loanAmount !== undefined ? String(answers.loanAmount) : "",
    loanPurpose: answers.loanPurpose !== undefined ? String(answers.loanPurpose) : "",
    // Полный слепок анкеты — на случай, если понадобятся детали, которых нет
    // в отдельных колонках. Apps Script может положить это в отдельную колонку как есть.
    answersJson: JSON.stringify(answers),
  };

  const ATTEMPTS = 2;
  let lastError = "Неизвестная ошибка запроса к Google Sheets webhook";

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
        // Apps Script Web Apps часто отвечают 302-редиректом на итоговый ответ.
        redirect: "follow",
      });

      if (!response.ok) {
        lastError = `Google Sheets webhook вернул ошибку: ${response.status}`;
      } else {
        return { ok: true };
      }
    } catch (error) {
      lastError =
        error instanceof Error && error.name === "AbortError"
          ? "Google Sheets webhook не ответил вовремя (таймаут)"
          : error instanceof Error
            ? error.message
            : lastError;
    } finally {
      clearTimeout(timeout);
    }

    if (attempt < ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  return { ok: false, error: lastError };
}
