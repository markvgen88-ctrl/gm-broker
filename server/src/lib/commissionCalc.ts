import { commissionConfig, type CommissionConfig } from "./commissionConfig.js";

export type CreditHistory = "good" | "neutral" | "closed_overdue" | "bad" | "severe";
export type DebtLoad = "normal" | "high" | "critical";
export type Collateral = "none" | "simple" | "complex";
export type Arrests = "none" | "on_collateral" | "other";

export interface CommissionInput {
  amount: number;
  mortgage: boolean;
  history: CreditHistory;
  debtLoad: DebtLoad;
  collateral: Collateral;
  /** Примерная стоимость залога, ₽ (обязательна, если залог есть). */
  collateralValue?: number;
  arrests: Arrests;
  multipleBorrowers: boolean;
}

export type EstimateNote =
  | "collateral_arrested"
  | "collateral_partial"
  | "collateral_not_counted"
  | "arrests_check";

export type CommissionEstimate =
  | { kind: "mortgage" }
  | {
      kind: "estimate";
      percentLow: number;
      percentHigh: number;
      rubLow: number;
      rubHigh: number;
      complex: boolean;
      notes: EstimateNote[];
    };

/** Подробный расчёт — для менеджера/отладки, клиенту не отдаётся. */
export interface CommissionBreakdown {
  work: number;
  risk: number;
  score: number;
  tierIndex: number;
  centerPercent: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function tierIndexFor(amount: number, cfg: CommissionConfig): number {
  const i = cfg.tiers.findIndex((t) => amount <= t.upTo);
  return i === -1 ? cfg.tiers.length - 1 : i;
}

/**
 * Комиссия в рублях для суммы с учётом баллов и сдвига ставки (shift, п.п.).
 * Защита от «обрыва»: при переходе в диапазон с меньшей ставкой комиссия
 * не может стать меньше комиссии на верхней границе предыдущего диапазона
 * (за большую сумму клиент никогда не платит меньше, чем за меньшую).
 */
function commissionRub(amount: number, score: number, shift: number, cfg: CommissionConfig): number {
  const i = tierIndexFor(amount, cfg);
  const t = cfg.tiers[i];
  const ratePercent = clamp(t.base + score * t.step + shift, t.min, t.max);
  const own = (amount * ratePercent) / 100;
  if (i === 0) return own;
  const boundary = cfg.tiers[i - 1].upTo;
  return Math.max(own, commissionRub(boundary, score, shift, cfg));
}

const round = (v: number, step: number) => Math.round(v / step) * step;
const round1 = (v: number) => Math.round(v * 10) / 10;

export function estimateCommission(
  input: CommissionInput,
  cfg: CommissionConfig = commissionConfig
): { estimate: CommissionEstimate; breakdown?: CommissionBreakdown } {
  if (input.mortgage) return { estimate: { kind: "mortgage" } };

  const notes: EstimateNote[] = [];
  const r = cfg.risk;

  // --- Залог: учитывается только ликвидный и без ареста на сам предмет залога.
  let collateral: Collateral = input.collateral;
  let arrestsWithoutCollateral = false;
  let otherArrestsWithCollateral = false;

  if (input.arrests === "on_collateral") {
    if (collateral !== "none") notes.push("collateral_arrested");
    collateral = "none";
    arrestsWithoutCollateral = true;
  }

  let ltv = Infinity;
  if (collateral !== "none") {
    ltv = input.collateralValue && input.collateralValue > 0 ? (input.amount / input.collateralValue) * 100 : Infinity;
    if (ltv > r.ltvHalfDiscountUpTo) {
      // Кредит слишком велик относительно залога — залог не считается ликвидным обеспечением.
      notes.push("collateral_not_counted");
    }
  }

  if (input.arrests === "other") {
    if (collateral !== "none") otherArrestsWithCollateral = true;
    else arrestsWithoutCollateral = true;
  }
  if (otherArrestsWithCollateral) notes.push("arrests_check");

  // --- Трудоёмкость W
  let work = 0;
  if (collateral === "simple") work += cfg.work.simpleCollateral;
  if (collateral === "complex") work += cfg.work.complexCollateral;
  if (otherArrestsWithCollateral) work += cfg.work.otherArrestsWithCollateral;
  if (input.multipleBorrowers) work += cfg.work.multipleBorrowers;
  work = Math.min(work, cfg.work.max);

  // --- Риск R
  const H = r.history[input.history];
  const D = r.debtLoad[input.debtLoad];
  const A = arrestsWithoutCollateral ? r.arrestsWithoutCollateral : 0;

  let Z = 0;
  if (collateral !== "none" && ltv <= r.ltvHalfDiscountUpTo) {
    const full = H >= r.badHistoryFromPoints ? r.collateralDiscountBadHistory : r.collateralDiscountMildHistory;
    let factor = ltv <= r.ltvFullDiscountUpTo ? 1 : 0.5;
    if (input.debtLoad === "high") factor = Math.min(factor, 0.5);
    if (input.debtLoad === "critical") factor = 0;
    if (factor < 1) notes.push("collateral_partial");
    Z = -full * factor;
  }

  const risk = Math.max(r.minTotal, H + D + A + Z);
  const score = work + risk;

  // --- Ставка и комиссия (вилка ±rangeHalfWidth п.п. вокруг центра)
  const tierIndex = tierIndexFor(input.amount, cfg);
  const tier = cfg.tiers[tierIndex];
  const centerPercent = clamp(tier.base + score * tier.step, tier.min, tier.max);

  const floor = cfg.minCommission;
  const centerRub = Math.max(commissionRub(input.amount, score, 0, cfg), floor);
  const lowRub = Math.max(commissionRub(input.amount, score, -cfg.rangeHalfWidth, cfg), floor);
  const highRub = Math.max(commissionRub(input.amount, score, cfg.rangeHalfWidth, cfg), floor);

  const toPercent = (rub: number) =>
    clamp(round1((rub / input.amount) * 100), cfg.absoluteMinPercent, cfg.absoluteMaxPercent);

  let percentLow = toPercent(lowRub);
  let percentHigh = toPercent(highRub);
  if (percentLow > percentHigh) [percentLow, percentHigh] = [percentHigh, percentLow];

  const complex = risk >= cfg.complexFromRisk || A > 0 || input.debtLoad === "critical";

  void centerRub; // центр нужен только для breakdown/проверок
  return {
    estimate: {
      kind: "estimate",
      percentLow,
      percentHigh,
      rubLow: round(lowRub, cfg.rubleRounding),
      rubHigh: round(highRub, cfg.rubleRounding),
      complex,
      notes: [...new Set(notes)],
    },
    breakdown: { work, risk, score, tierIndex, centerPercent },
  };
}
