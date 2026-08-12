import { Router } from "express";
import type { Request, Response } from "express";
import { submissionSchema } from "../lib/validation.js";
import { buildReport } from "../lib/reportTemplate.js";
import { sendTelegramMessage } from "../services/telegram.js";
import { sendEmailReport } from "../services/email.js";
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

  sendTelegramMessage(report.telegramText)
    .then((result) => {
      if (!result.ok) {
        console.error("[submit] Telegram delivery failed:", result.error);
      }
    })
    .catch((error) => {
      console.error("[submit] Telegram delivery threw unexpectedly:", error);
    });

  const emailResult = await withTimeout(
    sendEmailReport({ subject: report.subject, html: report.html }),
    11000,
    { ok: false, error: "Email delivery timed out (safety net)" }
  );

  if (!emailResult.ok) {
    console.error("[submit] Email delivery failed:", emailResult.error);
    return res.status(502).json({
      success: false,
      message: "Не удалось доставить заявку. Пожалуйста, попробуйте ещё раз чуть позже.",
    });
  }

  return res.status(200).json({ success: true });
});