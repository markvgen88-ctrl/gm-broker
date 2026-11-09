import { useEffect, useState } from "react";
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

/** Запрос к серверу. null — не получилось (тогда не кэшируем и пробуем снова при следующем показе). */
async function requestSurveySettings(): Promise<SurveySettings | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/survey-settings`, { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { settings?: Partial<SurveySettings> };
    const min = data.settings?.minLoanAmount;
    if (typeof min !== "number" || !Number.isFinite(min) || min < 0) return null;
    return { minLoanAmount: min };
  } catch {
    return null;
  }
}

// Настройки читаются один раз за открытие сайта и делятся между анкетой, главным
// экраном и SEO-описанием, чтобы везде была одна и та же минимальная сумма.
let cached: SurveySettings | null = null;
let inflight: Promise<SurveySettings | null> | null = null;

function loadSurveySettings(): Promise<SurveySettings | null> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = requestSurveySettings().then((settings) => {
      if (settings) cached = settings;
      inflight = null;
      return settings;
    });
  }
  return inflight;
}

/** Настройки опроса из CRM. До ответа сервера (или если он не ответил) — значения по умолчанию. */
export function useSurveySettings(): SurveySettings {
  const [settings, setSettings] = useState<SurveySettings>(cached ?? DEFAULT_SURVEY_SETTINGS);
  useEffect(() => {
    let cancelled = false;
    void loadSurveySettings().then((loaded) => {
      if (loaded && !cancelled) setSettings(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return settings;
}

const MIN_LOAN_TOKEN = /\{minLoanAmount\}/g;

/** 1000000 → «1 000 000» (для подстановки в тексты вопросов). */
export const formatAmount = (value: number) => value.toLocaleString("ru-RU");

/** Диапазон сумм для текстов на главной: «от 1 000 000 ₽ до 1,5 млрд ₽» (при минимуме 0 — «до 1,5 млрд ₽»). */
export function loanRangeText(minLoanAmount: number): string {
  return minLoanAmount > 0 ? `от ${formatAmount(minLoanAmount)} ₽ до 1,5 млрд ₽` : "до 1,5 млрд ₽";
}

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
