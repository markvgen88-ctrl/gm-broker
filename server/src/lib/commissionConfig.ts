/**
 * Настройки расчёта ориентировочной комиссии G.M. Broker.
 *
 * ВСЕ цифры модели лежат здесь и только здесь — чтобы подправить ставки,
 * границы или пороги, не нужно трогать логику расчёта (commissionCalc.ts).
 * Стартовые значения утверждены 22.10.2026 и предназначены для проверки
 * на реальных сделках: если результат где-то не совпадает с практикой,
 * меняйте числа ниже.
 */

export interface RateTier {
  /** Верхняя граница диапазона суммы, ₽ (включительно). Infinity — без верхней границы. */
  upTo: number;
  /** Базовая ставка для «обычного» кейса, %. */
  base: number;
  /** Нижняя граница ставки в этом диапазоне, %. */
  min: number;
  /** Верхняя граница ставки в этом диапазоне, %. */
  max: number;
  /** Сколько процентных пунктов стоит один балл сложности. 0 — ставка фиксирована. */
  step: number;
}

export interface CommissionConfig {
  /** Минимальная сумма кредита, с которой работаем, ₽. */
  minAmount: number;
  /** Максимальная сумма, принимаемая калькулятором (защита от мусорного ввода), ₽. */
  maxAmount: number;
  /** Минимальная комиссия за работу, ₽. */
  minCommission: number;
  /** Общие границы комиссии, %. */
  absoluteMinPercent: number;
  absoluteMaxPercent: number;
  /** Половина ширины вилки, которую видит клиент, п.п. */
  rangeHalfWidth: number;
  /** Округление рублей в ответе клиенту, ₽. */
  rubleRounding: number;
  tiers: RateTier[];

  /** Баллы трудоёмкости. */
  work: {
    simpleCollateral: number;
    complexCollateral: number;
    /** Аресты/производства НЕ на предмет залога при наличии залога — юридическая проверка. */
    otherArrestsWithCollateral: number;
    multipleBorrowers: number;
    max: number;
  };

  /** Баллы риска. */
  risk: {
    history: { good: number; neutral: number; closed_overdue: number; bad: number; severe: number };
    debtLoad: { normal: number; high: number; critical: number };
    /** Аресты/производства, когда залога нет (или залог под арестом). */
    arrestsWithoutCollateral: number;
    /** Скидка за ликвидный залог при истории не хуже «закрытые просрочки» / при плохой истории. */
    collateralDiscountMildHistory: number;
    collateralDiscountBadHistory: number;
    /** История с баллом не ниже этого считается «плохой» для скидки за залог. */
    badHistoryFromPoints: number;
    /** Залог: доля кредита от стоимости залога (LTV), %. */
    ltvFullDiscountUpTo: number;
    ltvHalfDiscountUpTo: number;
    /** Минимум суммарного риска (ограничивает общий дисконт). */
    minTotal: number;
  };

  /** Кейс считается сложным (для пометки клиенту), если суммарный риск не ниже этого. */
  complexFromRisk: number;
}

export const commissionConfig: CommissionConfig = {
  minAmount: 100_000,
  maxAmount: 10_000_000_000,
  minCommission: 15_000,
  absoluteMinPercent: 7,
  absoluteMaxPercent: 15,
  rangeHalfWidth: 1,
  rubleRounding: 1_000,

  tiers: [
    { upTo: 1_000_000, base: 15, min: 15, max: 15, step: 0 },
    { upTo: 3_000_000, base: 13, min: 12, max: 15, step: 1 },
    { upTo: 10_000_000, base: 11, min: 10, max: 15, step: 1 },
    { upTo: 30_000_000, base: 9, min: 8, max: 14, step: 1 },
    { upTo: 50_000_000, base: 8, min: 7, max: 12, step: 0.75 },
    { upTo: Infinity, base: 7, min: 7, max: 10, step: 0.5 },
  ],

  work: {
    simpleCollateral: 0.5,
    complexCollateral: 1,
    otherArrestsWithCollateral: 1,
    multipleBorrowers: 1,
    max: 3,
  },

  risk: {
    history: { good: -1, neutral: 0, closed_overdue: 1, bad: 2, severe: 3 },
    debtLoad: { normal: 0, high: 1, critical: 2 },
    arrestsWithoutCollateral: 2,
    collateralDiscountMildHistory: 1,
    collateralDiscountBadHistory: 2,
    badHistoryFromPoints: 2,
    ltvFullDiscountUpTo: 60,
    ltvHalfDiscountUpTo: 80,
    minTotal: -1,
  },

  complexFromRisk: 3,
};

/** Пороги долговой нагрузки (платежи по кредитам к доходу/выручке), для подсказок в форме. */
export const DEBT_LOAD_THRESHOLDS = { normalUpTo: 40, highUpTo: 60 } as const;
