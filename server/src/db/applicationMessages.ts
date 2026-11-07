import { pool } from "./pool.js";

export interface MessageAttachmentInfo {
  name: string;
  size: number;
}

export interface ApplicationMessage {
  id: number;
  toEmail: string;
  subject: string;
  body: string;
  attachments: MessageAttachmentInfo[];
  createdAt: string;
}

function toMessage(row: any): ApplicationMessage {
  return {
    id: row.id,
    toEmail: row.to_email,
    subject: row.subject,
    body: row.body,
    attachments: Array.isArray(row.attachments) ? (row.attachments as MessageAttachmentInfo[]) : [],
    createdAt: row.created_at,
  };
}

/** Имя и e-mail клиента по заявке (для адреса получателя). null — заявки нет. */
export async function getApplicationContact(id: number): Promise<{ name: string; email: string } | null> {
  const result = await pool.query<{ name: string; email: string }>(
    `SELECT name, email FROM applications WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

/** Записывает в историю отправленное письмо. null — заявки с таким id нет. */
export async function insertMessage(
  applicationId: number,
  data: { toEmail: string; subject: string; body: string; attachments: MessageAttachmentInfo[] }
): Promise<ApplicationMessage | null> {
  try {
    const result = await pool.query(
      `INSERT INTO application_messages (application_id, to_email, subject, body, attachments)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, to_email, subject, body, attachments, created_at`,
      [applicationId, data.toEmail, data.subject, data.body, JSON.stringify(data.attachments)]
    );
    return toMessage(result.rows[0]);
  } catch (err: any) {
    if (err?.code === "23503") return null;
    throw err;
  }
}

/** История писем по заявке, свежие сверху. */
export async function listMessagesForApplication(applicationId: number): Promise<ApplicationMessage[]> {
  const result = await pool.query(
    `SELECT id, to_email, subject, body, attachments, created_at
     FROM application_messages WHERE application_id = $1 ORDER BY created_at DESC, id DESC`,
    [applicationId]
  );
  return result.rows.map(toMessage);
}
