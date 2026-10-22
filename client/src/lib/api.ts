import type { AnswersState } from "@/types/questionnaire";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export interface SubmissionPayload {
  clientType: "individual" | "entrepreneur" | "legal_entity";
  answers: AnswersState;
  submittedAt: string;
}

export interface SubmissionResult {
  success: boolean;
  message?: string;
}

export async function submitApplication(payload: SubmissionPayload): Promise<SubmissionResult> {
  const response = await fetch(`${API_BASE_URL}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data: SubmissionResult | null = null;
  try {
    data = await response.json();
  } catch {
    // тело ответа может отсутствовать при сетевой ошибке — обработаем ниже
  }

  if (!response.ok) {
    throw new Error(data?.message ?? "Не удалось отправить заявку. Попробуйте ещё раз.");
  }

  return data ?? { success: true };
}

export interface FreezeRequestPayload {
  name: string;
  phone: string;
  email: string;
  comment?: string;
  consent: true;
  /** Поле-ловушка для ботов, человек его не заполняет. */
  website?: string;
}

export async function submitFreezeRequest(payload: FreezeRequestPayload): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/freeze-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data: { success?: boolean; message?: string } | null = null;
  try {
    data = await response.json();
  } catch {
    // тело ответа может отсутствовать при сетевой ошибке
  }

  if (!response.ok) {
    throw new Error(data?.message ?? "Не удалось отправить заявку. Попробуйте ещё раз.");
  }
}

export type CreditHistory = "good" | "neutral" | "closed_overdue" | "bad" | "severe";
export type DebtLoad = "normal" | "high" | "critical";
export type CollateralKind = "none" | "simple" | "complex";
export type ArrestsKind = "none" | "on_collateral" | "other";

export interface CommissionRequestPayload {
  amount: number;
  mortgage: boolean;
  history: CreditHistory;
  debtLoad: DebtLoad;
  collateral: CollateralKind;
  collateralValue?: number;
  arrests: ArrestsKind;
  multipleBorrowers: boolean;
}

export type EstimateNote = "collateral_arrested" | "collateral_partial" | "collateral_not_counted" | "arrests_check";

export type CommissionEstimate =
  | { kind: "mortgage" }
  | {
      kind: "estimate";
      percentLow: number;
      percentHigh: number;
      rubLow: number;
      rubHigh: number;
      complex: boolean;
      notes: EstimateNote[];
    };

/** Ориентировочная комиссия: формула считается на сервере, клиенту приходит только вилка. */
export async function requestCommissionEstimate(payload: CommissionRequestPayload): Promise<CommissionEstimate> {
  const response = await fetch(`${API_BASE_URL}/commission-estimate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data: { success?: boolean; message?: string; estimate?: CommissionEstimate } | null = null;
  try {
    data = await response.json();
  } catch {
    // тело ответа может отсутствовать при сетевой ошибке
  }

  if (!response.ok || !data?.estimate) {
    throw new Error(data?.message ?? "Не удалось выполнить расчёт. Попробуйте ещё раз.");
  }
  return data.estimate;
}
