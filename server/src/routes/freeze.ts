import { Router } from "express";
import type { Request, Response } from "express";
import { freezeRequestSchema } from "../lib/freezeValidation.js";
import { buildFreezeReport } from "../lib/freezeTemplate.js";
import { sendTelegramMessage } from "../services/telegram.js";
import { sendEmailReport } from "../services/email.js";
import { saveFreezeRequest } from "../db/freezeRequests.js";
import { freezeRateLimiter } from "../middleware/rateLimit.js";
import { withTimeout } from "../lib/withTimeout.js";

export const freezeRouter = Router();

/**
 * Заявка на «заморозку кредитного договора».
 *
 * Получает только брокер и уходит в три независимых канала: Telegram,
 * письмо на MAIL_TO и запись в базу. Успех — если сработал хотя бы один
 * канал, так заявка не теряется из-за сбоя одного сервиса. Сбои каждого
 * канала пишутся в лог сервера.
 */
freezeRouter.post("/freeze-request", freezeRateLimiter, async (req: Request, res: Response) => {
  const parsed = freezeRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Некорректные данные заявки";
    return res.status(400).json({ success: false, message });
  }

  // Ловушка для ботов: поле заполнено — изображаем успех, но ничего не отправляем.
  if (parsed.data.website && parsed.data.website.trim() !== "") {
    return res.status(200).json({ success: true });
  }

  const report = buildFreezeReport(parsed.data);

  const [telegramResult, emailResult, dbResult] = await Promise.all([
    withTimeout(sendTelegramMessage(report.telegramText), 8000, { ok: false, error: "Telegram: таймаут запроса" }),
    withTimeout(sendEmailReport({ subject: report.subject, html: report.html }), 11000, {
      ok: false,
      error: "Email: таймаут запроса",
    }),
    withTimeout(saveFreezeRequest(parsed.data), 6500, { ok: false, error: "База: таймаут запроса" }),
  ]);

  const results = { telegram: telegramResult, email: emailResult, db: dbResult };
  for (const [channel, result] of Object.entries(results)) {
    if (!result.ok) console.error(`[freeze] ${channel} delivery failed:`, result.error);
  }

  const anySucceeded = telegramResult.ok || emailResult.ok || dbResult.ok;
  if (!anySucceeded) {
    console.error("[freeze] All delivery channels failed — request was not saved anywhere.");
    return res.status(502).json({
      success: false,
      message: "Не удалось отправить заявку. Пожалуйста, попробуйте ещё раз чуть позже.",
    });
  }

  return res.status(200).json({ success: true });
});
