import type { InputNode, QuestionNode } from "@/types/questionnaire";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

/**
 * Настройки опроса, которые задаются в CRM («Настройки опроса»). Сайт читает их
 * при открытии анкеты; если сервер не ответил, работает со значениями по умолчанию.
 */
export interface SurveySettings {
  /** Минимальная сумма кредита, ₽. 0 — без ограничения. */
  minLoanAmount: number;
}

export const DEFAULT_SURVEY_SETTINGS: SurveySettings = {
  minLoanAmount: 1_000_000,
};

export async function fetchSurveySettings(): Promise<SurveySettings> {
  try {
    const response = await fetch(`${API_BASE_URL}/survey-settings`, { cache: "no-store" });
    if (!response.ok) return DEFAULT_SURVEY_SETTINGS;
    const data = (await response.json()) as { settings?: Partial<SurveySettings> };
    const min = data.settings?.minLoanAmount;
    return {
      minLoanAmount: typeof min === "number" && Number.isFinite(min) && min >= 0 ? min : DEFAULT_SURVEY_SETTINGS.minLoanAmount,
    };
  } catch {
    return DEFAULT_SURVEY_SETTINGS;
  }
}

const MIN_LOAN_TOKEN = /\{minLoanAmount\}/g;

/** 1000000 → «1 000 000» (для подстановки в тексты вопросов). */
export const formatAmount = (value: number) => value.toLocaleString("ru-RU");

/**
 * Подставляет настройки в узел анкеты: числовое ограничение (belowMin.setting),
 * а в текстах подсказки и экрана отказа — токен {minLoanAmount}. Если минимум
 * равен 0, ограничение и подсказка у вопроса убираются.
 */
export function applySurveySettings(node: QuestionNode, settings: SurveySettings): QuestionNode {
  const min = settings.minLoanAmount;

  if (node.kind === "input" && node.belowMin?.setting === "minLoanAmount") {
    if (min <= 0) {
      const { belowMin: _belowMin, hint: _hint, ...rest } = node;
      void _belowMin;
      void _hint;
      return rest as InputNode;
    }
    return {
      ...node,
      belowMin: { ...node.belowMin, value: min },
      hint: node.hint?.replace(MIN_LOAN_TOKEN, formatAmount(min)),
    };
  }

  if (node.kind === "decline") {
    return {
      ...node,
      message: node.message.replace(MIN_LOAN_TOKEN, formatAmount(min)),
      hint: node.hint?.replace(MIN_LOAN_TOKEN, formatAmount(min)),
    };
  }

  return node;
}
