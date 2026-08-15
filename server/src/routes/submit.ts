import { Router } from "express";
import type { Request, Response } from "express";
import { submissionSchema } from "../lib/validation.js";
import { buildReport } from "../lib/reportTemplate.js";
import { formatFieldValue } from "../lib/fields.js";
import { sendTelegramMessage } from "../services/telegram.js";
import { sendEmailReport } from "../services/email.js";
import { sendSheetsBackup } from "../services/sheets.js";
import { submitRateLimiter } from "../middleware/rateLimit.js";
import { withTimeout } from "../lib/withTimeout.js";
import { insertLead } from "../lib/db.js";

export const submitRouter = Router();

submitRouter.post("/submit", submitRateLimiter, async (req: Request, res: Response) => {
  const parsed = submissionSchema.safeParse(req.body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Некорректные данные анкеты";
    return res.status(400).json({ success: false, message });
  }

  const report = buildReport(parsed.data);

  // Сохраняем лид в локальную базу мини-CRM (страница /admin) — это происходит
  // синхронно, не зависит от внешних сервисов и на практике почти никогда не
  // даёт сбоя (обычная запись на диск). Это самый надёжный из всех каналов,
  // поэтому его результат тоже учитывается ниже при определении общего успеха.
  let leadSaved = false;
  try {
    const { answers, clientType, submittedAt } = parsed.data;
    insertLead({
      createdAt: submittedAt,
      clientType,
      name: String(answers.name ?? ""),
      phone: String(answers.phone ?? ""),
      email: String(answers.contactInfo ?? ""),
      loanAmount: answers.loanAmount !== undefined ? formatFieldValue("loanAmount", answers.loanAmount) : null,
      loanPurpose: answers.loanPurpose !== undefined ? String(answers.loanPurpose) : null,
      answers,
    });
    leadSaved = true;
  } catch (error) {
    console.error("[submit] Failed to save lead to local CRM database:", error);
  }

  // Заявка одновременно уходит в три независимых уведомительных канала
  // (Telegram, Email, резервная Google-таблица) в дополнение к сохранению
  // в CRM выше. Каналы не блокируют друг друга: если, например, временно
  // недоступен SMTP, заявка всё равно попадёт в Telegram и в таблицу.
  // Успехом считаем ситуацию, когда сработал хотя бы один канал (включая
  // CRM) — так заявка почти никогда не теряется целиком из-за сбоя одного
  // конкретного сервиса.
  const [telegramResult, emailResult, sheetsResult] = await Promise.all([
    withTimeout(sendTelegramMessage(report.telegramText), 8000, {
      ok: false,
      error: "Telegram: таймаут запроса",
    }),
    withTimeout(sendEmailReport({ subject: report.subject, html: report.html }), 11000, {
      ok: false,
      error: "Email: таймаут запроса",
    }),
    withTimeout(sendSheetsBackup(parsed.data), 6500, {
      ok: false,
      error: "Sheets: таймаут запроса",
    }),
  ]);

  const results = { telegram: telegramResult, email: emailResult, sheets: sheetsResult };
  const anySucceeded = leadSaved || telegramResult.ok || emailResult.ok || sheetsResult.ok;

  for (const [channel, result] of Object.entries(results)) {
    if (!result.ok) {
      console.error(`[submit] ${channel} delivery failed:`, result.error);
    }
  }

  if (!anySucceeded) {
    console.error("[submit] All delivery channels (including local CRM) failed — lead was not saved anywhere.");
    return res.status(502).json({
      success: false,
      message: "Не удалось доставить заявку. Пожалуйста, попробуйте ещё раз чуть позже.",
    });
  }

  return res.status(200).json({ success: true });
});
