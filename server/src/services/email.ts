import nodemailer from "nodemailer";

interface EmailSendResult {
  ok: boolean;
  error?: string;
}

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 4500,
    greetingTimeout: 4500,
    socketTimeout: 4500,
  });

  return cachedTransporter;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendEmailReport(params: {
  subject: string;
  html: string;
}): Promise<EmailSendResult> {
  const transporter = getTransporter();
  const to = process.env.MAIL_TO;
  const from = process.env.MAIL_FROM ?? process.env.SMTP_USER;

  if (!transporter || !to || !from) {
    return { ok: false, error: "SMTP не настроен на сервере (проверьте .env)" };
  }

  const ATTEMPTS = 2;
  let lastError = "Неизвестная ошибка SMTP";

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      await transporter.sendMail({
        from: `"G.M. Broker — заявки с сайта" <${from}>`,
        to,
        subject: params.subject,
        html: params.html,
      });
      return { ok: true };
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
      if (attempt < ATTEMPTS) {
        await delay(500);
      }
    }
  }

  return { ok: false, error: lastError };
}

export interface ClientEmailAttachment {
  filename: string;
  content: Buffer;
}

/**
 * Отдельный транспорт для писем клиентам: во вложениях могут быть файлы до
 * нескольких мегабайт, поэтому таймауты больше, чем у служебных уведомлений.
 */
let cachedClientTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getClientTransporter() {
  if (cachedClientTransporter) return cachedClientTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;

  cachedClientTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 60000,
  });
  return cachedClientTransporter;
}

/**
 * Письмо клиенту из CRM. Одна попытка без автоповтора: если сервер почты
 * ответил с задержкой уже после приёма письма, повтор отправил бы клиенту
 * дубль. Ответ клиента приходит на Reply-To (по умолчанию — MAIL_TO), а
 * скрытая копия (BCC) уходит на MAIL_TO, чтобы письмо осталось в вашей почте.
 */
export async function sendEmailToClient(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments: ClientEmailAttachment[];
}): Promise<EmailSendResult> {
  const transporter = getClientTransporter();
  const from = process.env.MAIL_FROM ?? process.env.SMTP_USER;
  const replyTo = process.env.MAIL_REPLY_TO ?? process.env.MAIL_TO;
  const bcc = process.env.MAIL_TO;

  if (!transporter || !from) {
    return { ok: false, error: "SMTP не настроен на сервере (проверьте .env)" };
  }

  try {
    await transporter.sendMail({
      from: `"G.M. Broker" <${from}>`,
      to: params.to,
      ...(replyTo ? { replyTo } : {}),
      ...(bcc && bcc.toLowerCase() !== params.to.toLowerCase() ? { bcc } : {}),
      subject: params.subject,
      text: params.text,
      html: params.html,
      attachments: params.attachments.map((a) => ({ filename: a.filename, content: a.content })),
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Неизвестная ошибка SMTP" };
  }
}
