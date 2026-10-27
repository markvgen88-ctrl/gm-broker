import { pool, isDatabaseConfigured } from "./pool.js";
import type { ServiceRequestInput } from "../lib/serviceRequestValidation.js";

export interface ServiceRequestSaveResult {
  ok: boolean;
  error?: string;
}

/**
 * Сохраняет заявку на услугу в базе. Отдельная таблица (исторически
 * freeze_requests — раньше в ней были только заявки на заморозку), а не
 * общий список анкет: у этой заявки нет типа клиента и ответов анкеты.
 * Какая именно услуга — в колонке `service` (slug страницы услуги).
 */
export async function saveServiceRequest(data: ServiceRequestInput): Promise<ServiceRequestSaveResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "База данных не настроена" };
  }
  try {
    await pool.query(
      `INSERT INTO freeze_requests (service, name, phone, email, telegram, comment) VALUES ($1, $2, $3, $4, $5, $6)`,
      [data.service, data.name, data.phone, data.email, data.telegram || null, data.comment || null]
    );
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Ошибка базы данных" };
  }
}
