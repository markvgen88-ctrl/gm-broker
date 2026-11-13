import { pool, isDatabaseConfigured } from "./pool.js";
import type { ServiceRequestInput } from "../lib/serviceRequestValidation.js";
import { REQUEST_SERVICES } from "../lib/requestServices.js";

export interface ServiceRequestSaveResult {
  ok: boolean;
  error?: string;
}

/**
 * Сохраняет заявку на услугу в базе. Отдельная таблица (исторически
 * freeze_requests — раньше в ней были только заявки на заморозку), а не
 * общий список анкет: у этой заявки нет типа клиента и ответов анкеты.
 * Какая именно услуга — в колонке `service` (slug страницы услуги).
 * Статус новой заявки берётся из значения по умолчанию колонки `status`
 * (см. db/schema.ts) — «Новая заявка».
 */
export async function saveServiceRequest(data: ServiceRequestInput): Promise<ServiceRequestSaveResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "База данных не настроена" };
  }
  try {
    await pool.query(
      `INSERT INTO freeze_requests (service, name, phone, email, telegram, comment, answers) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.service,
        data.name,
        data.phone,
        data.email,
        data.telegram || null,
        data.comment || null,
        data.answers && data.answers.length > 0 ? JSON.stringify(data.answers) : null,
      ]
    );
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Ошибка базы данных" };
  }
}

// ---------------------------------------------------------------------------
// Раздел «Услуги» в CRM (/admin/service-requests)
// ---------------------------------------------------------------------------

export interface ServiceRequestComment {
  id: number;
  text: string;
  createdAt: string;
}

export interface ServiceRequestListItem {
  id: number;
  createdAt: string;
  /** slug страницы услуги, например «bankrotstvo-cherez-sud» */
  service: string;
  /** Читаемое название услуги для панели */
  serviceTitle: string;
  name: string;
  phone: string;
  email: string | null;
  telegram: string | null;
  /** Комментарий, который клиент оставил в форме на сайте */
  clientComment: string | null;
  status: string;
  /** Ответы мини-опроса (кредитные каникулы); у остальных заявок — пустой список */
  answers: { question: string; answer: string }[];
  /** Последний комментарий брокера в CRM */
  lastComment: { text: string; createdAt: string } | null;
}

export interface ServiceRequestDetail extends ServiceRequestListItem {
  comments: ServiceRequestComment[];
}

/** Название услуги по slug; для незнакомого slug (услугу убрали из списка) — сам slug. */
export function getServiceTitle(slug: string): string {
  const entry = (REQUEST_SERVICES as Record<string, { title: string }>)[slug];
  return entry?.title ?? slug;
}

function toListItem(row: any): ServiceRequestListItem {
  return {
    id: row.id,
    createdAt: row.created_at,
    service: row.service,
    serviceTitle: getServiceTitle(row.service),
    name: row.name,
    phone: row.phone,
    email: row.email ?? null,
    telegram: row.telegram ?? null,
    clientComment: row.comment ?? null,
    status: row.status,
    answers: Array.isArray(row.answers) ? row.answers : [],
    lastComment:
      row.last_comment_text !== undefined && row.last_comment_text !== null
        ? { text: row.last_comment_text, createdAt: row.last_comment_created_at }
        : null,
  };
}

// LATERAL-подзапрос подтягивает только самый свежий комментарий на заявку —
// для маленькой иконки с последним комментарием в списке.
const LIST_QUERY = `
  SELECT r.id, r.created_at, r.service, r.name, r.phone, r.email, r.telegram, r.comment, r.status, r.answers,
         c.text AS last_comment_text, c.created_at AS last_comment_created_at
  FROM freeze_requests r
  LEFT JOIN LATERAL (
    SELECT text, created_at
    FROM service_request_comments
    WHERE request_id = r.id
    ORDER BY created_at DESC
    LIMIT 1
  ) c ON true
  ORDER BY r.created_at DESC
  LIMIT 500
`;

/** Все заявки по услугам, свежие сверху. */
export async function listServiceRequests(): Promise<ServiceRequestListItem[]> {
  const result = await pool.query(LIST_QUERY);
  return result.rows.map(toListItem);
}

/** Карточка заявки по услуге: данные клиента + комментарии брокера. */
export async function getServiceRequestById(id: number): Promise<ServiceRequestDetail | null> {
  const reqResult = await pool.query(
    `SELECT id, created_at, service, name, phone, email, telegram, comment, status, answers
     FROM freeze_requests WHERE id = $1`,
    [id]
  );
  const row = reqResult.rows[0];
  if (!row) return null;

  const commentsResult = await pool.query<{ id: number; text: string; created_at: string }>(
    `SELECT id, text, created_at FROM service_request_comments WHERE request_id = $1 ORDER BY created_at ASC`,
    [id]
  );
  const comments = commentsResult.rows.map((c) => ({ id: c.id, text: c.text, createdAt: c.created_at }));

  return {
    ...toListItem(row),
    comments,
    lastComment: comments.length > 0 ? comments[comments.length - 1] : null,
  };
}

/** Меняет статус заявки. false — заявка с таким id не найдена. */
export async function updateServiceRequestStatus(id: number, status: string): Promise<boolean> {
  const result = await pool.query(`UPDATE freeze_requests SET status = $1, updated_at = now() WHERE id = $2`, [
    status,
    id,
  ]);
  return (result.rowCount ?? 0) > 0;
}

/** Удаляет заявку вместе с комментариями (каскадно). */
export async function deleteServiceRequest(id: number): Promise<boolean> {
  const result = await pool.query(`DELETE FROM freeze_requests WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

/** Добавляет комментарий к заявке. null — заявка не найдена. */
export async function addServiceRequestComment(id: number, text: string): Promise<ServiceRequestComment | null> {
  try {
    const result = await pool.query<{ id: number; text: string; created_at: string }>(
      `INSERT INTO service_request_comments (request_id, text) VALUES ($1, $2) RETURNING id, text, created_at`,
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
