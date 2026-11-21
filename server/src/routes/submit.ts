import { Router } from "express";
import type { Request, Response } from "express";
import { submissionSchema } from "../lib/validation.js";
import { buildReport } from "../lib/reportTemplate.js";
import { sendTelegramMessage } from "../services/telegram.js";
import { sendEmailReport } from "../services/email.js";
import {
  REPEAT_APPLICATION_DAYS,
  getRepeatApplicationAvailableFrom,
  saveApplicationForCrm,
} from "../db/applications.js";
import { isDatabaseConfigured } from "../db/pool.js";
import { checkRepeatRateLimiter, submitRateLimiter } from "../middleware/rateLimit.js";
import { withTimeout } from "../lib/withTimeout.js";

export const submitRouter = Router();

const CONTACT_EMAIL = "info-gm-broker@bk.ru";

/** «21 декабря 2026 г.» из строки ГГГГ-ММ-ДД. */
function formatRuDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d))).replace(/\s*г\.$/, " года");
}

/**
 * Возвращает текст отказа, если клиент (по телефону или e-mail) уже подавал
 * заявку меньше REPEAT_APPLICATION_DAYS дней назад, иначе null. Если проверить
 * не удалось (CRM-база недоступна или не настроена), заявку НЕ блокируем —
 * лучше принять лишнюю, чем потерять клиента.
 */
async function checkRepeatLimit(phone: unknown, email: unknown): Promise<string | null> {
  if (REPEAT_APPLICATION_DAYS <= 0 || !isDatabaseConfigured()) return null;
  const availableFrom = await withTimeout(
    getRepeatApplicationAvailableFrom(phone, email).catch((err) => {
      console.error("[submit] repeat check failed:", err instanceof Error ? err.message : err);
      return null;
    }),
    3000,
    null
  );
  if (!availableFrom) return null;
  return (
    `Заявка с этими контактными данными уже отправлена, повторную можно подать с ${formatRuDate(availableFrom)}. ` +
    `Если вы ещё не получили ответ, напишите на почту ${CONTACT_EMAIL} с запросом статуса вашей заявки.`
  );
}

/** Проверка по кнопке «Согласен» на последнем шаге анкеты: можно ли этому клиенту сейчас подать заявку. */
submitRouter.post("/check-repeat", checkRepeatRateLimiter, async (req: Request, res: Response) => {
  const phone = typeof req.body?.phone === "string" ? req.body.phone : "";
  const email = typeof req.body?.contactInfo === "string" ? req.body.contactInfo : "";
  if (!phone.trim() && !email.trim()) {
    return res.status(400).json({ success: false, message: "Укажите телефон и e-mail" });
  }
  const message = await checkRepeatLimit(phone, email);
  return res.status(200).json(message ? { success: true, allowed: false, message } : { success: true, allowed: true });
});

submitRouter.post("/submit", submitRateLimiter, async (req: Request, res: Response) => {
  const parsed = submissionSchema.safeParse(req.body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Некорректные данные анкеты";
    return res.status(400).json({ success: false, message });
  }

  // Повторную заявку принимаем не чаще, чем раз в REPEAT_APPLICATION_DAYS дней.
  // Основная проверка идёт по кнопке «Согласен» (/check-repeat), а здесь она
  // дублируется — на случай, если кто-то отправит заявку в обход сайта.
  const blockMessage = await checkRepeatLimit(parsed.data.answers.phone, parsed.data.answers.contactInfo);
  if (blockMessage) {
    return res.status(409).json({ success: false, code: "REPEAT_TOO_SOON", message: blockMessage });
  }

  const report = buildReport(parsed.data);

  // Заявка одновременно уходит в три независимых канала (Telegram, Email и
  // CRM-база). Каналы не блокируют друг друга: если, например, временно
  // недоступен SMTP, заявка всё равно попадёт в Telegram и в CRM. Успехом
  // считаем ситуацию, когда сработал хотя бы один канал — так заявка почти
  // никогда не теряется целиком из-за сбоя одного конкретного сервиса. CRM —
  // единственный канал, который даёт заявке постоянный id для дальнейшей
  // работы в /admin; Telegram и Email — уведомления.
  const [telegramResult, emailResult, crmResult] = await Promise.all([
    withTimeout(sendTelegramMessage(report.telegramText), 8000, {
      ok: false,
      error: "Telegram: таймаут запроса",
    }),
    withTimeout(sendEmailReport({ subject: report.subject, html: report.html }), 11000, {
      ok: false,
      error: "Email: таймаут запроса",
    }),
    withTimeout(saveApplicationForCrm(parsed.data), 6500, {
      ok: false,
      error: "CRM: таймаут запроса",
    }),
  ]);

  const results = { telegram: telegramResult, email: emailResult, crm: crmResult };
  const anySucceeded = telegramResult.ok || emailResult.ok || crmResult.ok;

  for (const [channel, result] of Object.entries(results)) {
    if (!result.ok) {
      console.error(`[submit] ${channel} delivery failed:`, result.error);
    }
  }

  if (!anySucceeded) {
    console.error("[submit] All delivery channels failed — lead was not saved anywhere.");
    return res.status(502).json({
      success: false,
      message: "Не удалось доставить заявку. Пожалуйста, попробуйте ещё раз чуть позже.",
    });
  }

  return res.status(200).json({ success: true });
});
