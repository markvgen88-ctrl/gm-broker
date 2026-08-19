import { pool } from "./pool.js";
import type { ContractInput } from "../lib/contractValidation.js";

export interface ContractSummary {
  id: number;
  applicationId: number;
  contractNum: number;
  clientType: string;
  clientName: string;
  createdAt: string;
}

export interface ContractRecord extends ContractSummary {
  input: ContractInput;
}

function toSummary(row: any): ContractSummary {
  return {
    id: row.id,
    applicationId: row.application_id,
    contractNum: row.contract_num,
    clientType: row.client_type,
    clientName: row.client_name,
    createdAt: row.created_at,
  };
}

/** Следующий номер договора — общий сквозной счётчик (продолжает нумерацию старого бота). */
async function nextContractNum(): Promise<number> {
  const result = await pool.query<{ last_num: number }>(
    `UPDATE contract_counter SET last_num = last_num + 1 WHERE id = 1 RETURNING last_num`
  );
  return result.rows[0].last_num;
}

/**
 * Создаёт запись о договоре, привязанную к заявке. Сами данные анкеты
 * договора (input) сохраняются целиком — по ним при скачивании документ
 * перегенерируется заново, файл в базе отдельно не хранится.
 * Возвращает null, если заявки с таким id не существует.
 */
export async function createContract(applicationId: number, input: ContractInput): Promise<ContractRecord | null> {
  const contractNum = await nextContractNum();
  const clientName = input.data.name;

  try {
    const result = await pool.query(
      `INSERT INTO contracts (application_id, contract_num, client_type, client_name, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, application_id, contract_num, client_type, client_name, data, created_at`,
      [applicationId, contractNum, input.clientType, clientName, JSON.stringify(input)]
    );
    const row = result.rows[0];
    return { ...toSummary(row), input: row.data as ContractInput };
  } catch (err: any) {
    // Нарушение внешнего ключа — заявки с таким id не существует.
    if (err?.code === "23503") return null;
    throw err;
  }
}

/** История договоров по заявке, свежие сверху — для карточки заявки. */
export async function listContractsForApplication(applicationId: number): Promise<ContractSummary[]> {
  const result = await pool.query(
    `SELECT id, application_id, contract_num, client_type, client_name, created_at
     FROM contracts WHERE application_id = $1 ORDER BY created_at DESC`,
    [applicationId]
  );
  return result.rows.map(toSummary);
}

/** Полная запись договора (с исходными данными анкеты) — нужна для скачивания/перегенерации файла. */
export async function getContractById(id: number): Promise<ContractRecord | null> {
  const result = await pool.query(
    `SELECT id, application_id, contract_num, client_type, client_name, data, created_at
     FROM contracts WHERE id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  return { ...toSummary(row), input: row.data as ContractInput };
}
