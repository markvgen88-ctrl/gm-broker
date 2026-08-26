import { Router } from "express";
import type { Request, Response } from "express";
import { submissionSchema } from "../lib/validation.js";
import { buildReport } from "../lib/reportTemplate.js";
import { sendTelegramMessage } from "../services/telegram.js";
import { sendEmailReport } from "../services/email.js";
import { saveApplicationForCrm } from "../db/applications.js";
import { submitRateLimiter } from "../middleware/rateLimit.js";
import { withTimeout } from "../lib/withTimeout.js";

export const submitRouter = Router();

submitRouter.post("/submit", submitRateLimiter, async (req: Request, res: Response) => {
  const parsed = submissionSchema.safeParse(req.body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Некорректные данные анкеты";
    return res.status(400).json({ success: false, message });
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
