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