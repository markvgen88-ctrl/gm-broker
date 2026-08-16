import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { adminLoginRateLimiter } from "../middleware/rateLimit.js";
import { clearSessionCookie, issueSessionCookie, requireAdminAuth, verifyAdminPassword } from "../middleware/adminAuth.js";
import { isValidStatus } from "../lib/statuses.js";
import {
  addComment,
  getApplicationById,
  listApplications,
  updateApplicationStatus,
} from "../db/applications.js";
import { isDatabaseConfigured } from "../db/pool.js";

export const adminRouter = Router();

/** База не настроена — все /admin/* эндпоинты (кроме логина) недоступны. */
function requireDatabase(_req: Request, res: Response, next: () => void): void {
  if (!isDatabaseConfigured()) {
    res.status(503).json({ success: false, message: "CRM ещё не настроена: не задан DATABASE_URL." });
    return;
  }
  next();
}

adminRouter.post("/login", adminLoginRateLimiter, (req: Request, res: Response) => {
  const password = (req.body as { password?: unknown } | undefined)?.password;
  if (!verifyAdminPassword(password)) {
    res.status(401).json({ success: false, message: "Неверный пароль" });
    return;
  }
  issueSessionCookie(res);
  res.json({ success: true });
});

adminRouter.post("/logout", (_req: Request, res: Response) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

// Всё, что ниже, требует активной сессии и настроенной базы.
adminRouter.use(requireAdminAuth, requireDatabase);

adminRouter.get("/session", (_req: Request, res: Response) => {
  res.json({ success: true });
});

adminRouter.get("/applications", async (req: Request, res: Response) => {
  const statusParam = typeof req.query.status === "string" ? req.query.status : undefined;
  if (statusParam && !isValidStatus(statusParam)) {
    res.status(400).json({ success: false, message: "Неизвестный статус" });
    return;
  }
  const items = await listApplications(statusParam);
  res.json({ success: true, items });
});

adminRouter.get("/applications/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ success: false, message: "Некорректный id заявки" });
    return;
  }
  const item = await getApplicationById(id);
  if (!item) {
    res.status(404).json({ success: false, message: "Заявка не найдена" });
    return;
  }
  res.json({ success: true, item });
});

const statusSchema = z.object({ status: z.string() });

adminRouter.patch("/applications/:id/status", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const parsed = statusSchema.safeParse(req.body);
  if (!Number.isInteger(id) || !parsed.success || !isValidStatus(parsed.data.status)) {
    res.status(400).json({ success: false, message: "Некорректные данные" });
    return;
  }
  const updated = await updateApplicationStatus(id, parsed.data.status);
  if (!updated) {
    res.status(404).json({ success: false, message: "Заявка не найдена" });
    return;
  }
  res.json({ success: true });
});

const commentSchema = z.object({ text: z.string().trim().min(1).max(4000) });

adminRouter.post("/applications/:id/comments", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const parsed = commentSchema.safeParse(req.body);
  if (!Number.isInteger(id) || !parsed.success) {
    res.status(400).json({ success: false, message: "Комментарий не может быть пустым" });
    return;
  }
  const comment = await addComment(id, parsed.data.text);
  if (!comment) {
    res.status(404).json({ success: false, message: "Заявка не найдена" });
    return;
  }
  res.json({ success: true, comment });
});
