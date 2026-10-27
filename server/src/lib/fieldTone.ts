/**
 * Оценка ответа анкеты для подсветки в карточке CRM:
 *   "bad"     — негативный фактор (красный)
 *   "good"    — позитивный фактор (зелёный)
 *   "neutral" — без подсветки
 *
 * Все правила собраны здесь — чтобы поменять, какой ответ считается хорошим
 * или плохим, достаточно поправить списки ниже.
 */

export type FieldTone = "good" | "bad" | "neutral";

/** Ответ «Да» — плохо, «Нет» — хорошо. */
const YES_IS_BAD = new Set([
  "hasBankruptcy",
  "hasCurrentOverdue",
  "hadOverdue12m",
  "usesMFO",
  "isPledged",
  "hasMinorOwners",
  "hasArrest",
]);

/** Ответ «Да» — хорошо, «Нет» — плохо. */
const YES_IS_GOOD = new Set([
  "isEmployed",
  "isSoleOwner",
  "ipConsentToIndividual",
  "llcConsentToCollateral",
]);

/** «Да» — хорошо, «Нет» — без подсветки. */
const ONLY_YES_IS_GOOD = new Set(["hasCar"]);

/**
 * Свободный текст («Например: нет, или 50 000 ₽»): «нет» / «0» — хорошо,
 * любой другой непустой ответ — негативный фактор.
 */
const FREE_TEXT_NEGATIVE = new Set(["taxDebt", "block115", "bailiffBlock"]);

function isNegativeAnswer(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[.!\s]+$/g, "");
  return /^(нет|не?т|отсутствует|нету|без|-|—|0(\s?₽|\s?руб\w*)?)$/.test(t) || /^нет[\s,.;:!-]/.test(t);
}

export function getFieldTone(key: string, raw: unknown): FieldTone {
  if (raw === undefined || raw === null || raw === "") return "neutral";
  const value = String(raw);

  if (YES_IS_BAD.has(key)) return value === "yes" ? "bad" : value === "no" ? "good" : "neutral";
  if (YES_IS_GOOD.has(key)) return value === "yes" ? "good" : value === "no" ? "bad" : "neutral";
  if (ONLY_YES_IS_GOOD.has(key)) return value === "yes" ? "good" : "neutral";

  if (key === "hasProperty") return value === "owns" ? "good" : value === "no" ? "bad" : "neutral";
  if (key === "closeRelativesPledgeConsent") return value === "yes" ? "good" : value === "no" ? "bad" : "neutral";

  if (FREE_TEXT_NEGATIVE.has(key)) return isNegativeAnswer(value) ? "good" : "bad";

  return "neutral";
}
