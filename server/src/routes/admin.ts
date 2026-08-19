import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { adminLoginRateLimiter } from "../middleware/rateLimit.js";
import { clearSessionCookie, issueSessionCookie, requireAdminAuth, verifyAdminPassword } from "../middleware/adminAuth.js";
import { isValidStatusText } from "../lib/statuses.js";
import {
  addComment,
  deleteApplication,
  getApplicationById,
  listApplications,
  updateApplicationStatus,
} from "../db/applications.js";
import { isDatabaseConfigured } from "../db/pool.js";
import { createContract, deleteContract, getContractById } from "../db/contracts.js";
import { contractInputSchema } from "../lib/contractValidation.js";
import { generateContractDocx } from "../lib/contractTemplate.js";

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
  issueSessionCookie(req, res);
  res.json({ success: true });
});

adminRouter.post("/logout", (req: Request, res: Response) => {
  clearSessionCookie(req, res);
  res.json({ success: true });
});

// Всё, что ниже, требует активной сессии и настроенной базы.
adminRouter.use(requireAdminAuth, requireDatabase);

adminRouter.get("/session", (_req: Request, res: Response) => {
  res.json({ success: true });
});

adminRouter.get("/applications", async (req: Request, res: Response) => {
  const statusParam = typeof req.query.status === "string" ? req.query.status : undefined;
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

adminRouter.delete("/applications/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ success: false, message: "Некорректный id заявки" });
    return;
  }
  const deleted = await deleteApplication(id);
  if (!deleted) {
    res.status(404).json({ success: false, message: "Заявка не найдена" });
    return;
  }
  res.json({ success: true });
});

const statusSchema = z.object({ status: z.string() });

adminRouter.patch("/applications/:id/status", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const parsed = statusSchema.safeParse(req.body);
  if (!Number.isInteger(id) || !parsed.success || !isValidStatusText(parsed.data.status)) {
    res.status(400).json({ success: false, message: "Статус не может быть пустым или слишком длинным" });
    return;
  }
  const updated = await updateApplicationStatus(id, parsed.data.status.trim());
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

adminRouter.post("/applications/:id/contracts", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ success: false, message: "Некорректный id заявки" });
    return;
  }
  const parsed = contractInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: parsed.error.issues[0]?.message ?? "Некорректные данные договора",
    });
    return;
  }
  const contract = await createContract(id, parsed.data);
  if (!contract) {
    res.status(404).json({ success: false, message: "Заявка не найдена" });
    return;
  }
  res.json({
    success: true,
    contract: {
      id: contract.id,
      applicationId: contract.applicationId,
      contractNum: contract.contractNum,
      clientType: contract.clientType,
      clientName: contract.clientName,
      createdAt: contract.createdAt,
    },
  });
});

/**
 * Файл в базе отдельно не хранится — при каждом скачивании (в том числе
 * повторном, из истории на карточке заявки) договор перегенерируется
 * заново из сохранённых данных анкеты. Это гарантирует, что скачанный
 * файл всегда соответствует актуальному шаблону.
 */
adminRouter.get("/contracts/:id/download", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ success: false, message: "Некорректный id договора" });
    return;
  }
  const contract = await getContractById(id);
  if (!contract) {
    res.status(404).json({ success: false, message: "Договор не найден" });
    return;
  }
  try {
    const buffer = generateContractDocx(contract.contractNum, contract.input);
    const firstWord = contract.clientName.split(/\s+/)[0] ?? "Договор";
    const niceFilename = `Договор_${contract.contractNum}_${firstWord}.docx`;
    const asciiFallback = `contract_${contract.contractNum}.docx`;
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(niceFilename)}`
    );
    res.send(buffer);
  } catch (err) {
    console.error("[admin] Не удалось сгенерировать файл договора:", err);
    res.status(500).json({ success: false, message: "Не удалось сформировать файл договора" });
  }
});

adminRouter.delete("/contracts/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ success: false, message: "Некорректный id договора" });
    return;
  }
  const deleted = await deleteContract(id);
  if (!deleted) {
    res.status(404).json({ success: false, message: "Договор не найден" });
    return;
  }
  res.json({ success: true });
});
