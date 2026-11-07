import { pool } from "./pool.js";
import { DEFAULT_EMAIL_TEMPLATES, DEFAULT_SIGNATURE } from "../lib/defaultEmailTemplates.js";

export interface EmailTemplate {
  id: number;
  label: string;
  subject: string;
  body: string;
}

function toTemplate(row: any): EmailTemplate {
  return { id: row.id, label: row.label, subject: row.subject, body: row.body };
}

export async function listEmailTemplates(): Promise<EmailTemplate[]> {
  const result = await pool.query(`SELECT id, label, subject, body FROM email_templates ORDER BY id`);
  return result.rows.map(toTemplate);
}

export async function createEmailTemplate(data: Omit<EmailTemplate, "id">): Promise<EmailTemplate> {
  const result = await pool.query(
    `INSERT INTO email_templates (label, subject, body) VALUES ($1, $2, $3) RETURNING id, label, subject, body`,
    [data.label, data.subject, data.body]
  );
  return toTemplate(result.rows[0]);
}

/** null — шаблона с таким id нет. */
export async function updateEmailTemplate(id: number, data: Omit<EmailTemplate, "id">): Promise<EmailTemplate | null> {
  const result = await pool.query(
    `UPDATE email_templates SET label = $2, subject = $3, body = $4, updated_at = now()
     WHERE id = $1 RETURNING id, label, subject, body`,
    [id, data.label, data.subject, data.body]
  );
  return result.rows[0] ? toTemplate(result.rows[0]) : null;
}

export async function deleteEmailTemplate(id: number): Promise<boolean> {
  const result = await pool.query(`DELETE FROM email_templates WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function getEmailSignature(): Promise<string> {
  const result = await pool.query<{ value: string }>(`SELECT value FROM email_settings WHERE key = 'signature'`);
  return result.rows[0]?.value ?? "";
}

export async function setEmailSignature(value: string): Promise<void> {
  await pool.query(
    `INSERT INTO email_settings (key, value) VALUES ('signature', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [value]
  );
}

/**
 * Один раз заполняет шаблоны и подпись значениями по умолчанию. Флаг
 * templates_seeded не даёт добавить их повторно после перезапуска, даже если
 * вы удалили все шаблоны. Вставка флага атомарна — два экземпляра сервера
 * не создадут дубли.
 */
export async function seedEmailDefaults(): Promise<void> {
  const already = await pool.query(`SELECT 1 FROM email_settings WHERE key = 'templates_seeded'`);
  if ((already.rowCount ?? 0) > 0) return;

  const flag = await pool.query(
    `INSERT INTO email_settings (key, value) VALUES ('templates_seeded', '1')
     ON CONFLICT (key) DO NOTHING RETURNING key`
  );
  if (flag.rows.length === 0) return;

  for (const t of DEFAULT_EMAIL_TEMPLATES) {
    await pool.query(`INSERT INTO email_templates (label, subject, body) VALUES ($1, $2, $3)`, [
      t.label,
      t.subject,
      t.body,
    ]);
  }
  await pool.query(
    `INSERT INTO email_settings (key, value) VALUES ('signature', $1) ON CONFLICT (key) DO NOTHING`,
    [DEFAULT_SIGNATURE]
  );
}
