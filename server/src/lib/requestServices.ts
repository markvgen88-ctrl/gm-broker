/**
 * Услуги, на которые с сайта можно оставить отдельную заявку.
 * Ключ — slug страницы /services/:slug на клиенте; он приходит в заявке
 * в поле `service`. Название попадает в тему письма, Telegram и базу,
 * чтобы сразу было видно, какую услугу выбрал клиент.
 * Добавляя услугу с формой на сайте, добавьте её и сюда.
 */
export const REQUEST_SERVICES = {
  "zamorozka-kreditnogo-dogovora": { title: "Заморозка кредитного договора", emoji: "❄️" },
  "bankrotstvo-cherez-sud": { title: "Банкротство через суд", emoji: "⚖️" },
  "vnesudebnoe-bankrotstvo": { title: "Внесудебное банкротство", emoji: "📄" },
  "restrukturizatsiya-dolga": { title: "Реструктуризация долга", emoji: "🔧" },
  "ispravlenie-kreditnoy-istorii": { title: "Исправление кредитной истории", emoji: "🔍" },
} as const;

export type RequestServiceSlug = keyof typeof REQUEST_SERVICES;

export const REQUEST_SERVICE_SLUGS = Object.keys(REQUEST_SERVICES) as [RequestServiceSlug, ...RequestServiceSlug[]];

/** Услуга по умолчанию — для старых клиентов сайта, которые не присылают поле `service`. */
export const DEFAULT_REQUEST_SERVICE: RequestServiceSlug = "zamorozka-kreditnogo-dogovora";
