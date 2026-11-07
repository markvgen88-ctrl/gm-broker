/**
 * Предложение «Кредитные каникулы»: общие константы и память «не показывать».
 *
 * Где показывается:
 *  - плашка в углу экрана (components/layout/KanikulyPromo.tsx) — через 10 секунд
 *    на сайте при каждом заходе (даже если её закрывали раньше); внутри одного
 *    захода после закрытия повторно не показывается;
 *  - карточка на экране «Анкета отправлена» — только физлицам с действующими
 *    кредитами (components/wizard/SuccessScreen.tsx).
 *
 * Идентификаторы целей для Метрики (создавать в Метрике как «JavaScript-событие»
 * с теми же названиями): см. GOALS.
 */

/** Адрес страницы услуги: /services/<slug> (slug не менять — на него ссылаются sitemap и база заявок). */
export const KANIKULY_SLUG = "zamorozka-kreditnogo-dogovora";
export const KANIKULY_PATH = `/services/${KANIKULY_SLUG}`;

/**
 * Текст предложения: один и тот же в плашке на сайте и в сообщении в конце
 * анкеты (SuccessScreen). Менять здесь — изменится в обоих местах.
 */
export const KANIKULY_COPY = {
  label: "Кредитные каникулы",
  headlineLead: "Стоп: вы точно хотите платить банку проценты ",
  headlineAccent: "впустую?",
  text: "Не платите лишнего, пока не узнали про отсрочку: на каникулах проценты не начисляются.",
  cta: "Узнать, подойдут ли мне каникулы",
  note: "Для физлиц, без ареста счетов приставами. Условия индивидуальны.",
} as const;

/** Сколько секунд на сайте до показа плашки. */
export const PROMO_DELAY_SECONDS = 10;
/** Через сколько секунд после появления плашки показывается крестик «Закрыть». */
export const PROMO_CLOSE_DELAY_SECONDS = 15;

export const GOALS = {
  promoShown: "kanikuly_promo_shown",
  promoClick: "kanikuly_promo_click",
  promoClose: "kanikuly_promo_close",
  offerShown: "kanikuly_offer_shown",
  offerClick: "kanikuly_offer_click",
} as const;

const STORAGE_KEY = "gm_kanikuly_promo_hidden";

/**
 * true, если в этом заходе плашку уже закрывали, переходили по ней или предлагали
 * то же самое после анкеты. Хранится в sessionStorage: при новом заходе на сайт
 * (новая вкладка или браузер открыт заново) плашка показывается снова.
 */
export function isPromoHiddenThisVisit(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // sessionStorage может быть недоступен (приватный режим) — тогда не помним.
    return false;
  }
}

/** Запоминает, что в этом заходе плашку больше не показывать. */
export function hidePromoForVisit(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Не критично.
  }
}
