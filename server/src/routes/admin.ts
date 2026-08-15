import { Router } from "express";
import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { checkAdminPassword, issueSession, clearSession, isAuthenticated } from "../lib/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { listLeads, updateLeadStatus, listLeadNotes, addLeadNote, isLeadStatus } from "../lib/db.js";

export const adminRouter = Router();

/** Отдельный (более строгий) лимит на попытки входа — защита от подбора пароля. */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Слишком много попыток входа. Попробуйте позже." },
});

adminRouter.post("/login", loginRateLimiter, (req: Request, res: Response) => {
  if (!process.env.ADMIN_PASSWORD) {
    console.error("[admin] ADMIN_PASSWORD не задан в .env — вход в /admin невозможен.");
    return res.status(500).json({ success: false, message: "Админ-панель не настроена на сервере" });
  }

  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!password || !checkAdminPassword(password)) {
    return res.status(401).json({ success: false, message: "Неверный пароль" });
  }

  issueSession(res);
  res.json({ success: true });
});

adminRouter.post("/logout", (req: Request, res: Response) => {
  clearSession(req, res);
  res.json({ success: true });
});

adminRouter.get("/me", (req: Request, res: Response) => {
  res.json({ authenticated: isAuthenticated(req) });
});

adminRouter.get("/leads", requireAdmin, (_req: Request, res: Response) => {
  res.json({ success: true, leads: listLeads() });
});

adminRouter.patch("/leads/:id/status", requireAdmin, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const status = req.body?.status;

  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: "Некорректный id заявки" });
  }
  if (!isLeadStatus(status)) {
    return res.status(400).json({ success: false, message: "Некорректный статус" });
  }

  const updated = updateLeadStatus(id, status);
  if (!updated) {
    return res.status(404).json({ success: false, message: "Заявка не найдена" });
  }
  res.json({ success: true, lead: updated });
});

adminRouter.get("/leads/:id/notes", requireAdmin, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: "Некорректный id заявки" });
  }
  res.json({ success: true, notes: listLeadNotes(id) });
});

adminRouter.post("/leads/:id/notes", requireAdmin, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";

  if (!Number.isInteger(id)) {
    return res.status(400).json({ success: false, message: "Некорректный id заявки" });
  }
  if (!text) {
    return res.status(400).json({ success: false, message: "Заметка не может быть пустой" });
  }
  if (text.length > 4000) {
    return res.status(400).json({ success: false, message: "Заметка слишком длинная (максимум 4000 символов)" });
  }

  const note = addLeadNote(id, text);
  if (!note) {
    return res.status(404).json({ success: false, message: "Заявка не найдена" });
  }
  res.json({ success: true, note });
});
