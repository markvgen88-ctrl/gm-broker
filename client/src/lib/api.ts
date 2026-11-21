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

export interface RepeatCheckResult {
  allowed: boolean;
  message?: string;
}

/** Проверка перед согласием: не подавал ли клиент заявку слишком недавно (по телефону или e-mail). */
export async function checkRepeatApplication(phone: string, contactInfo: string): Promise<RepeatCheckResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/check-repeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, contactInfo }),
    });
  } catch {
    throw new Error("Не удалось выполнить проверку. Проверьте интернет и попробуйте ещё раз.");
  }

  let data: { allowed?: boolean; message?: string } | null = null;
  try {
    data = await response.json();
  } catch {
    // тело ответа может отсутствовать
  }

  if (!response.ok) {
    throw new Error(data?.message ?? "Не удалось выполнить проверку. Попробуйте ещё раз.");
  }
  return { allowed: data?.allowed !== false, message: data?.message };
}

export interface SurveyAnswer {
  question: string;
  answer: string;
}

export interface ServiceRequestPayload {
  /** slug услуги (/services/:slug), на которую оставлена заявка. */
  service: string;
  name: string;
  phone: string;
  email: string;
  telegram?: string;
  comment?: string;
  /** Ответы мини-опроса перед заявкой (кредитные каникулы). */
  answers?: SurveyAnswer[];
  consent: true;
  /** Поле-ловушка для ботов, человек его не заполняет. */
  website?: string;
}

export async function submitServiceRequest(payload: ServiceRequestPayload): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/service-request`, {
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
