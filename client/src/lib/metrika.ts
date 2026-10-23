/**
 * Обёртка над window.ym для отправки целей в Яндекс.Метрику.
 *
 * Зачем отдельный файл: счётчик подключается напрямую в index.html (см. корневой
 * тег <script> с ym(...)), а window.ym может быть недоступен — если скрипт ещё
 * не успел загрузиться, заблокирован adblock'ом, или страница открыта не в браузере
 * (SSR/тесты). Обёртка не должна ронять приложение ни в одном из этих случаев.
 *
 * ID counter'а зашит здесь и должен совпадать с тем, что в index.html.
 */

const COUNTER_ID = 113752805;

type YandexMetrika = (counterId: number, action: string, ...args: unknown[]) => void;

declare global {
  interface Window {
    ym?: YandexMetrika;
  }
}

/** Названия целей анкеты — держим в одном месте, чтобы не разойтись при опечатке. */
export const WIZARD_GOALS = {
  /** Пользователь ответил на первый вопрос анкеты (реальное начало прохождения). */
  START: "wizard_start",
  /** Достигнут очередной узел анкеты (шаг). Параметр step — номер шага. */
  STEP: "wizard_step",
  /** Пользователь дошёл до финального шага (форма имени и e-mail). */
  REACHED_CONTACT_FORM: "wizard_reached_contact_form",
  /** Анкета завершилась отказом (терминальный decline-узел). */
  DECLINE: "wizard_decline",
  /** Заявка успешно отправлена и доставлена (минимум один канал сработал). */
  LEAD_SUBMITTED: "wizard_lead_submitted",
} as const;

/** Цели форм обратной связи (кроме анкеты) — держим в одном месте, как и цели анкеты. */
export const FORM_GOALS = {
  /** Клик по кнопке «Отправить заявку» в форме услуги (даже если форма не прошла проверку). */
  SERVICE_REQUEST_CLICK: "service_request_click",
  /** Заявка с формы услуги успешно отправлена. Параметр service — slug услуги. */
  SERVICE_REQUEST_SUBMITTED: "service_request_submitted",
} as const;

/**
 * Отправляет цель в Яндекс.Метрику. Безопасна к вызову в любой момент:
 * если window.ym недоступен (не загрузился/заблокирован), просто ничего не делает.
 */
export function reachGoal(target: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.ym !== "function") return;
  try {
    window.ym(COUNTER_ID, "reachGoal", target, params);
  } catch {
    // Намеренно игнорируем — недоступность метрики не должна ломать анкету.
  }
}

/**
 * Отправляет в Метрику просмотр страницы вручную (метод hit).
 *
 * Сайт — одностраничное приложение: при переходе между разделами браузер не
 * перезагружает страницу, и счётчик сам этого не видит. Поэтому при смене
 * маршрута нужно вызывать hit() — иначе в Метрике засчитывается только первая
 * загрузка. Безопасна к вызову в любой момент (см. reachGoal).
 */
export function hit(url: string, options?: { title?: string; referer?: string }): void {
  if (typeof window === "undefined" || typeof window.ym !== "function") return;
  try {
    window.ym(COUNTER_ID, "hit", url, options);
  } catch {
    // Недоступность метрики не должна ломать сайт.
  }
}
