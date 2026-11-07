import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import multer from "multer";
import { adminLoginRateLimiter, adminMessageRateLimiter } from "../middleware/rateLimit.js";
import { clearSessionCookie, issueSessionCookie, requireAdminAuth, verifyAdminPassword } from "../middleware/adminAuth.js";
import { isValidStatusText } from "../lib/statuses.js";
import {
  addComment,
  deleteApplication,
  getApplicationById,
  listApplications,
  listApplicationsForExport,
  updateApplicationStatus,
} from "../db/applications.js";
import { isDatabaseConfigured } from "../db/pool.js";
import { createContract, deleteContract, getContractById } from "../db/contracts.js";
import { contractInputSchema } from "../lib/contractValidation.js";
import { buildApplicationsWorkbook, moscowDateStamp } from "../lib/applicationsExport.js";
import { generateContractDocx } from "../lib/contractTemplate.js";
import { getApplicationContact, insertMessage } from "../db/applicationMessages.js";
import type { MessageAttachmentInfo } from "../db/applicationMessages.js";
import { sendEmailToClient } from "../services/email.js";
import type { ClientEmailAttachment } from "../services/email.js";
import {
  MAX_CONTRACTS_PER_MESSAGE,
  MAX_TOTAL_ATTACHMENTS_BYTES,
  MAX_UPLOADED_FILES,
  fixFilenameEncoding,
  isAllowedAttachmentName,
  isPlausibleEmail,
  sanitizeAttachmentName,
  textToHtml,
} from "../lib/clientMail.js";
import {
  addServiceRequestComment,
  deleteServiceRequest,
  getServiceRequestById,
  listServiceRequests,
  updateServiceRequestStatus,
} from "../db/serviceRequests.js";

export const adminRouter = Router();

/**
 * Ответы /admin/* зависят от сессионной куки, поэтому их нельзя кэшировать ни
 * в браузере, ни в промежуточных прокси хостинга: иначе ответ 401, полученный
 * до входа, может «залипнуть» и вернуть на форму входа уже после правильного
 * пароля (лечится только F5). Заголовок ставится до проверки авторизации, так
 * что действует и на ответы 401/503.
 */
adminRouter.use((_req: Request, res: Response, next: () => void) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

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

/**
 * Выгрузка всех заявок в один лист Excel. Файл не хранится — собирается из
 * базы в момент нажатия кнопки, поэтому всегда содержит свежие заявки и
 * комментарии. Объявлен выше «/applications/:id», иначе «export.xlsx»
 * был бы принят за id заявки. Необязательный ?status= оставляет только
 * заявки с этим статусом.
 */
adminRouter.get("/applications/export.xlsx", async (req: Request, res: Response) => {
  const status = typeof req.query.status === "string" && req.query.status !== "" ? req.query.status : undefined;
  try {
    const rows = await listApplicationsForExport(status);
    const buffer = await buildApplicationsWorkbook(rows);
    const niceFilename = `Заявки_GM-Broker_${moscowDateStamp()}.xlsx`;
    const asciiFallback = `applications_${moscowDateStamp()}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(niceFilename)}`
    );
    // В файле персональные данные клиентов — не даём кэшировать.
    res.setHeader("Cache-Control", "no-store");
    res.send(buffer);
  } catch (err) {
    console.error("[admin] Не удалось сформировать выгрузку в Excel:", err);
    res.status(500).json({ success: false, message: "Не удалось сформировать файл Excel" });
  }
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

// ---------------------------------------------------------------------------
// Письмо клиенту из карточки заявки (с вложениями). Файлы в памяти, на диск и в
// базу не пишутся — в историю попадают только названия и размеры.
// ---------------------------------------------------------------------------

const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_TOTAL_ATTACHMENTS_BYTES,
    files: MAX_UPLOADED_FILES,
    fields: 10,
    fieldSize: 100 * 1024,
  },
});

const messageSchema = z.object({
  subject: z.string().trim().min(1, "Укажите тему письма").max(200, "Тема письма слишком длинная"),
  body: z.string().trim().min(1, "Напишите текст письма").max(20000, "Текст письма слишком длинный"),
  contractIds: z
    .array(z.number().int().positive(), { error: "Некорректный список договоров" })
    .max(MAX_CONTRACTS_PER_MESSAGE, `Можно приложить не больше ${MAX_CONTRACTS_PER_MESSAGE} договоров`)
    .default([]),
});

function parseContractIds(raw: unknown): unknown {
  if (raw === undefined || raw === "") return [];
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

adminRouter.post(
  "/applications/:id/messages",
  adminMessageRateLimiter,
  (req: Request, res: Response, next: () => void) => {
    attachmentUpload.array("files", MAX_UPLOADED_FILES)(req, res, (err: unknown) => {
      if (!err) {
        next();
        return;
      }
      const code = err instanceof multer.MulterError ? err.code : "";
      const message =
        code === "LIMIT_FILE_SIZE"
          ? "Файл слишком большой: максимум 10 МБ на письмо"
          : code === "LIMIT_FILE_COUNT" || code === "LIMIT_UNEXPECTED_FILE"
            ? `Можно прикрепить не больше ${MAX_UPLOADED_FILES} файлов`
            : "Не удалось принять вложения";
      res.status(400).json({ success: false, message });
    });
  },
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ success: false, message: "Некорректный id заявки" });
      return;
    }

    const contact = await getApplicationContact(id);
    if (!contact) {
      res.status(404).json({ success: false, message: "Заявка не найдена" });
      return;
    }
    const to = contact.email.trim();
    if (!isPlausibleEmail(to)) {
      res.status(400).json({ success: false, message: "В заявке нет корректного e-mail клиента" });
      return;
    }

    const rawBody = (req.body ?? {}) as Record<string, unknown>;
    const parsed = messageSchema.safeParse({
      subject: typeof rawBody.subject === "string" ? rawBody.subject.replace(/[\r\n]+/g, " ") : "",
      body: typeof rawBody.body === "string" ? rawBody.body.replace(/\r\n/g, "\n") : "",
      contractIds: parseContractIds(rawBody.contractIds),
    });
    if (!parsed.success) {
      res.status(400).json({ success: false, message: parsed.error.issues[0]?.message ?? "Проверьте поля письма" });
      return;
    }
    const { subject, body, contractIds } = parsed.data;

    const attachments: ClientEmailAttachment[] = [];

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    for (const file of files) {
      const name = sanitizeAttachmentName(fixFilenameEncoding(file.originalname));
      if (!isAllowedAttachmentName(name)) {
        res.status(400).json({
          success: false,
          message: `Файл «${name}» нельзя отправить: допустимы документы, таблицы, картинки и архивы`,
        });
        return;
      }
      attachments.push({ filename: name, content: file.buffer });
    }

    for (const contractId of new Set(contractIds)) {
      const contract = await getContractById(contractId);
      if (!contract || contract.applicationId !== id) {
        res.status(400).json({ success: false, message: "Договор не найден в этой заявке" });
        return;
      }
      try {
        const firstWord = contract.clientName.split(/\s+/)[0] ?? "Договор";
        attachments.push({
          filename: sanitizeAttachmentName(`Договор_${contract.contractNum}_${firstWord}.docx`),
          content: generateContractDocx(contract.contractNum, contract.input),
        });
      } catch (err) {
        console.error("[admin] Не удалось сформировать договор для письма:", err);
        res.status(500).json({ success: false, message: "Не удалось сформировать файл договора для письма" });
        return;
      }
    }

    const totalSize = attachments.reduce((sum, a) => sum + a.content.length, 0);
    if (totalSize > MAX_TOTAL_ATTACHMENTS_BYTES) {
      res.status(400).json({ success: false, message: "Вложения весят больше 10 МБ: уберите часть файлов" });
      return;
    }

    const sent = await sendEmailToClient({ to, subject, text: body, html: textToHtml(body), attachments });
    if (!sent.ok) {
      console.error("[admin] Письмо клиенту не отправлено:", sent.error);
      res.status(502).json({ success: false, message: `Не удалось отправить письмо: ${sent.error ?? "ошибка почты"}` });
      return;
    }

    // Письмо уже ушло — сбой записи в историю не должен выглядеть как неотправка.
    let saved = null;
    try {
      const info: MessageAttachmentInfo[] = attachments.map((a) => ({ name: a.filename, size: a.content.length }));
      saved = await insertMessage(id, { toEmail: to, subject, body, attachments: info });
    } catch (err) {
      console.error("[admin] Письмо отправлено, но не записано в историю:", err);
    }
    res.json({ success: true, sentMessage: saved });
  }
);

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

// ---------------------------------------------------------------------------
// Заявки по услугам (заморозка, банкротство и т. д.) — отдельный раздел CRM,
// не смешивается с анкетами на кредитование. Статусы и комментарии те же по
// смыслу, но хранятся отдельно (freeze_requests / service_request_comments).
// ---------------------------------------------------------------------------

adminRouter.get("/service-requests", async (_req: Request, res: Response) => {
  const items = await listServiceRequests();
  res.json({ success: true, items });
});

adminRouter.get("/service-requests/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ success: false, message: "Некорректный id заявки" });
    return;
  }
  const item = await getServiceRequestById(id);
  if (!item) {
    res.status(404).json({ success: false, message: "Заявка не найдена" });
    return;
  }
  res.json({ success: true, item });
});

adminRouter.delete("/service-requests/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ success: false, message: "Некорректный id заявки" });
    return;
  }
  const deleted = await deleteServiceRequest(id);
  if (!deleted) {
    res.status(404).json({ success: false, message: "Заявка не найдена" });
    return;
  }
  res.json({ success: true });
});

adminRouter.patch("/service-requests/:id/status", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const parsed = statusSchema.safeParse(req.body);
  if (!Number.isInteger(id) || !parsed.success || !isValidStatusText(parsed.data.status)) {
    res.status(400).json({ success: false, message: "Статус не может быть пустым или слишком длинным" });
    return;
  }
  const updated = await updateServiceRequestStatus(id, parsed.data.status.trim());
  if (!updated) {
    res.status(404).json({ success: false, message: "Заявка не найдена" });
    return;
  }
  res.json({ success: true });
});

adminRouter.post("/service-requests/:id/comments", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const parsed = commentSchema.safeParse(req.body);
  if (!Number.isInteger(id) || !parsed.success) {
    res.status(400).json({ success: false, message: "Комментарий не может быть пустым" });
    return;
  }
  const comment = await addServiceRequestComment(id, parsed.data.text);
  if (!comment) {
    res.status(404).json({ success: false, message: "Заявка не найдена" });
    return;
  }
  res.json({ success: true, comment });
});
