import { Router } from "express";
import type { Request, Response } from "express";
import { serviceRequestSchema } from "../lib/serviceRequestValidation.js";
import { buildServiceRequestReport } from "../lib/serviceRequestTemplate.js";
import { sendTelegramMessage } from "../services/telegram.js";
import { sendEmailReport } from "../services/email.js";
import { saveServiceRequest } from "../db/serviceRequests.js";
import { serviceRequestRateLimiter } from "../middleware/rateLimit.js";
import { withTimeout } from "../lib/withTimeout.js";

export const serviceRequestRouter = Router();

/**
 * Заявка на услугу с сайта: заморозка кредитного договора, банкротство,
 * реструктуризация и т. д. Какая именно услуга — в поле `service`.
 * Старый адрес /freeze-request оставлен для совместимости со старой версией
 * сайта (без поля `service` заявка считается заявкой на заморозку).
 *
 * Получает только брокер и уходит в три независимых канала: Telegram,
 * письмо на MAIL_TO и запись в базу. Успех — если сработал хотя бы один
 * канал, так заявка не теряется из-за сбоя одного сервиса. Сбои каждого
 * канала пишутся в лог сервера.
 */
serviceRequestRouter.post(["/service-request", "/freeze-request"], serviceRequestRateLimiter, async (req: Request, res: Response) => {
  const parsed = serviceRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Некорректные данные заявки";
    return res.status(400).json({ success: false, message });
  }

  // Ловушка для ботов: поле заполнено — изображаем успех, но ничего не отправляем.
  if (parsed.data.website && parsed.data.website.trim() !== "") {
    return res.status(200).json({ success: true });
  }

  const report = buildServiceRequestReport(parsed.data);

  const [telegramResult, emailResult, dbResult] = await Promise.all([
    withTimeout(sendTelegramMessage(report.telegramText), 8000, { ok: false, error: "Telegram: таймаут запроса" }),
    withTimeout(sendEmailReport({ subject: report.subject, html: report.html }), 11000, {
      ok: false,
      error: "Email: таймаут запроса",
    }),
    withTimeout(saveServiceRequest(parsed.data), 6500, { ok: false, error: "База: таймаут запроса" }),
  ]);

  const results = { telegram: telegramResult, email: emailResult, db: dbResult };
  for (const [channel, result] of Object.entries(results)) {
    if (!result.ok) console.error(`[service-request] ${channel} delivery failed:`, result.error);
  }

  const anySucceeded = telegramResult.ok || emailResult.ok || dbResult.ok;
  if (!anySucceeded) {
    console.error("[service-request] All delivery channels failed — request was not saved anywhere.");
    return res.status(502).json({
      success: false,
      message: "Не удалось отправить заявку. Пожалуйста, попробуйте ещё раз чуть позже.",
    });
  }

  return res.status(200).json({ success: true });
});
