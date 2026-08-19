import { pool, isDatabaseConfigured } from "./pool.js";
import type { SubmissionInput } from "../lib/validation.js";
import { FIELD_LABELS, FIELD_ORDER, formatFieldValue } from "../lib/fields.js";
import { DEFAULT_STATUS } from "../lib/statuses.js";
import { listContractsForApplication } from "./contracts.js";
import type { ContractSummary } from "./contracts.js";

interface CrmSaveResult {
  ok: boolean;
  error?: string;
}

/**
 * Четвёртый (независимый) канал приёма заявки — сохранение в CRM. В отличие
 * от Telegram/Email это не просто уведомление, а постоянная запись,
 * по которой потом можно менять статус и оставлять комментарии в /admin.
 * Если DATABASE_URL не настроен, канал просто неактивен — сайт продолжает
 * принимать заявки через остальные каналы как раньше.
 */
export async function saveApplicationForCrm(input: SubmissionInput): Promise<CrmSaveResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "CRM: DATABASE_URL не настроен на сервере" };
  }
  try {
    await insertApplication(input);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `CRM: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export interface ApplicationListItem {
  id: number;
  createdAt: string;
  clientType: string;
  clientTypeLabel: string;
  name: string;
  phone: string;
  email: string;
  loanAmount: string | null;
  status: string;
  lastComment: { text: string; createdAt: string } | null;
}

export interface ApplicationComment {
  id: number;
  text: string;
  createdAt: string;
}

export interface ApplicationDetail extends ApplicationListItem {
  fields: { label: string; value: string }[];
  comments: ApplicationComment[];
  contracts: ContractSummary[];
}

/** Сохраняет присланную анкету в базу как новую заявку CRM. */
export async function insertApplication(input: SubmissionInput): Promise<number> {
  const { answers, clientType, submittedAt } = input;
  const name = String(answers.name ?? "—");
  const phone = String(answers.phone ?? "—");
  const email = String(answers.contactInfo ?? "—");
  const loanAmount = answers.loanAmount !== undefined ? formatFieldValue("loanAmount", answers.loanAmount) : null;

  const result = await pool.query<{ id: number }>(
    `INSERT INTO applications (submitted_at, client_type, name, phone, email, loan_amount, answers, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [submittedAt, clientType, name, phone, email, loanAmount, JSON.stringify(answers), DEFAULT_STATUS]
  );
  return result.rows[0].id;
}

function toListItem(row: any): ApplicationListItem {
  return {
    id: row.id,
    createdAt: row.created_at,
    clientType: row.client_type,
    clientTypeLabel: formatFieldValue("clientType", row.client_type),
    name: row.name,
    phone: row.phone,
    email: row.email,
    loanAmount: row.loan_amount,
    status: row.status,
    lastComment:
      row.last_comment_text !== undefined && row.last_comment_text !== null
        ? { text: row.last_comment_text, createdAt: row.last_comment_created_at }
        : null,
  };
}

// LATERAL-подзапрос подтягивает только самый свежий комментарий на заявку —
// нужен для маленькой иконки с последним комментарием в списке на панели.
const LIST_QUERY_BASE = `
  SELECT a.id, a.created_at, a.client_type, a.name, a.phone, a.email, a.loan_amount, a.status,
         c.text AS last_comment_text, c.created_at AS last_comment_created_at
  FROM applications a
  LEFT JOIN LATERAL (
    SELECT text, created_at
    FROM application_comments
    WHERE application_id = a.id
    ORDER BY created_at DESC
    LIMIT 1
  ) c ON true
`;

/** Список заявок для панели, свежие сверху. Можно отфильтровать по статусу. */
export async function listApplications(status?: string): Promise<ApplicationListItem[]> {
  const result = status
    ? await pool.query(`${LIST_QUERY_BASE} WHERE a.status = $1 ORDER BY a.created_at DESC LIMIT 500`, [status])
    : await pool.query(`${LIST_QUERY_BASE} ORDER BY a.created_at DESC LIMIT 500`);
  return result.rows.map(toListItem);
}

/** Полная карточка заявки: все поля анкеты (отформатированные) + комментарии. */
export async function getApplicationById(id: number): Promise<ApplicationDetail | null> {
  const appResult = await pool.query(
    `SELECT id, created_at, client_type, name, phone, email, loan_amount, status, answers
     FROM applications WHERE id = $1`,
    [id]
  );
  const row = appResult.rows[0];
  if (!row) return null;

  const answers = row.answers as Record<string, string | number>;
  const fields = FIELD_ORDER.filter((key) => answers[key] !== undefined && answers[key] !== "").map((key) => ({
    label: FIELD_LABELS[key] ?? key,
    value: formatFieldValue(key, answers[key]),
  }));

  const commentsResult = await pool.query<{ id: number; text: string; created_at: string }>(
    `SELECT id, text, created_at FROM application_comments WHERE application_id = $1 ORDER BY created_at ASC`,
    [id]
  );
  const comments = commentsResult.rows.map((c) => ({ id: c.id, text: c.text, createdAt: c.created_at }));
  const contracts = await listContractsForApplication(id);

  return {
    ...toListItem(row),
    fields,
    comments,
    contracts,
    // row из запроса выше не содержит last_comment_*, поэтому берём последний
    // комментарий из уже загруженного списка (он отсортирован по возрастанию даты).
    lastComment: comments.length > 0 ? comments[comments.length - 1] : null,
  };
}

/** Меняет статус заявки. Возвращает false, если заявка с таким id не найдена. */
export async function updateApplicationStatus(id: number, status: string): Promise<boolean> {
  const result = await pool.query(`UPDATE applications SET status = $1, updated_at = now() WHERE id = $2`, [
    status,
    id,
  ]);
  return (result.rowCount ?? 0) > 0;
}

/** Удаляет заявку целиком (вместе с комментариями — они удалятся каскадно). */
export async function deleteApplication(id: number): Promise<boolean> {
  const result = await pool.query(`DELETE FROM applications WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

/** Добавляет комментарий к заявке. Возвращает null, если заявка не найдена. */
export async function addComment(id: number, text: string): Promise<ApplicationComment | null> {
  try {
    const result = await pool.query<{ id: number; text: string; created_at: string }>(
      `INSERT INTO application_comments (application_id, text) VALUES ($1, $2) RETURNING id, text, created_at`,
      [id, text]
    );
    const row = result.rows[0];
    return { id: row.id, text: row.text, createdAt: row.created_at };
  } catch (err: any) {
    // Нарушение внешнего ключа — заявки с таким id не существует.
    if (err?.code === "23503") return null;
    throw err;
  }
}
