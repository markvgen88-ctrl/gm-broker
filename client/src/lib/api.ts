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
