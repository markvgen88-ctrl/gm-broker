/**
 * Обёртка над window.ym (Яндекс.Метрика).
 *
 * Сам счётчик подключён в client/index.html. Здесь только безопасные вызовы:
 * если Метрика не загрузилась (блокировщик рекламы, медленная сеть), сайт
 * продолжает работать, просто ничего не отправляется.
 *
 * ID счётчика должен совпадать с тем, что в index.html (там он указан 3 раза).
 */

const COUNTER_ID = 113762938;

type YandexMetrika = (counterId: number, action: string, ...args: unknown[]) => void;

declare global {
  interface Window {
    ym?: YandexMetrika;
  }
}

/** Отправляет просмотр страницы вручную (сайт — SPA, браузер при переходах не перезагружается). */
export function hit(url: string, options?: { title?: string; referer?: string }): void {
  if (typeof window === "undefined" || typeof window.ym !== "function") return;
  try {
    window.ym(COUNTER_ID, "hit", url, options);
  } catch {
    // Недоступность Метрики не должна ломать сайт.
  }
}

/** Отправляет цель (JavaScript-событие). Будет использоваться на шаге с кнопками заявок. */
export function reachGoal(target: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.ym !== "function") return;
  try {
    window.ym(COUNTER_ID, "reachGoal", target, params);
  } catch {
    // Недоступность Метрики не должна ломать сайт.
  }
}
