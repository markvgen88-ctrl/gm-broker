import { pool, isDatabaseConfigured } from "./pool.js";
import type { FreezeRequestInput } from "../lib/freezeValidation.js";

export interface FreezeSaveResult {
  ok: boolean;
  error?: string;
}

/**
 * Сохраняет заявку на заморозку кредита в базе. Отдельная таблица, а не
 * общий список анкет: у этой заявки нет типа клиента и ответов анкеты.
 */
export async function saveFreezeRequest(data: FreezeRequestInput): Promise<FreezeSaveResult> {
  if (!isDatabaseConfigured()) {
    return { ok: false, error: "База данных не настроена" };
  }
  try {
    await pool.query(
      `INSERT INTO freeze_requests (name, phone, email, comment) VALUES ($1, $2, $3, $4)`,
      [data.name, data.phone, data.email, data.comment || null]
    );
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Ошибка базы данных" };
  }
}
