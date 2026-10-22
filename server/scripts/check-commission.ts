/**
 * Быстрая проверка калькулятора комиссии на типовых кейсах.
 * Запуск: npm run check:commission
 * Печатает вилку для каждого кейса и проверяет инварианты модели.
 */
import { estimateCommission, type CommissionInput } from "../src/lib/commissionCalc.js";

const base: CommissionInput = {
  amount: 5_000_000,
  mortgage: false,
  history: "neutral",
  debtLoad: "normal",
  collateral: "none",
  arrests: "none",
  multipleBorrowers: false,
};

const cases: Array<[string, Partial<CommissionInput>]> = [
  ["Обычный кейс 500 тыс.", { amount: 500_000 }],
  ["Обычный кейс 2 млн", { amount: 2_000_000 }],
  ["Обычный кейс 5 млн", {}],
  ["Обычный кейс 20 млн", { amount: 20_000_000 }],
  ["Обычный кейс 40 млн", { amount: 40_000_000 }],
  ["Обычный кейс 100 млн", { amount: 100_000_000 }],
  ["Хорошая история 5 млн", { history: "good" }],
  ["Закрытые просрочки, залог LTV 55%", { history: "closed_overdue", collateral: "simple", collateralValue: 9_090_000 }],
  ["Плохая история, нагрузка высокая, без залога", { amount: 4_000_000, history: "bad", debtLoad: "high" }],
  ["Плохая история, залог LTV 50%", { amount: 6_000_000, history: "bad", collateral: "simple", collateralValue: 12_000_000 }],
  ["Тяжёлая, нагрузка высокая, залог LTV 65%", { amount: 8_000_000, history: "severe", debtLoad: "high", collateral: "simple", collateralValue: 12_300_000 }],
  ["Производство без залога, закрытые просрочки", { amount: 15_000_000, history: "closed_overdue", arrests: "other" }],
  ["Залог под арестом, плохая история", { amount: 10_000_000, history: "bad", collateral: "simple", collateralValue: 20_000_000, arrests: "on_collateral" }],
  ["Нагрузка критическая, без залога", { amount: 25_000_000, debtLoad: "critical" }],
  ["Группа компаний, залог сложный, 60 млн", { amount: 60_000_000, history: "bad", debtLoad: "high", collateral: "complex", collateralValue: 110_000_000, multipleBorrowers: true }],
  ["Ипотека", { mortgage: true }],
];

let failed = 0;
const fmt = (n: number) => n.toLocaleString("ru-RU");
for (const [name, patch] of cases) {
  const { estimate, breakdown } = estimateCommission({ ...base, ...patch });
  if (estimate.kind === "mortgage") {
    console.log(`${name.padEnd(50)} → ипотека: обсуждается отдельно`);
    continue;
  }
  console.log(
    `${name.padEnd(50)} → ${estimate.percentLow}–${estimate.percentHigh}%  ${fmt(estimate.rubLow)}–${fmt(estimate.rubHigh)} ₽` +
      `${estimate.complex ? "  [сложный]" : ""}  (баллы ${breakdown?.score}, W ${breakdown?.work}, R ${breakdown?.risk}) ${estimate.notes.join(",")}`
  );
}

// Инвариант 1: комиссия не убывает с ростом суммы (нет «обрывов»), для любого профиля.
const profiles: Partial<CommissionInput>[] = [
  {},
  { history: "good" },
  { history: "bad", debtLoad: "high" },
  { history: "severe", arrests: "other" },
];
for (const p of profiles) {
  let prev = 0;
  for (let amount = 100_000; amount <= 200_000_000; amount = Math.round(amount * 1.01)) {
    const { estimate } = estimateCommission({ ...base, ...p, amount });
    if (estimate.kind !== "estimate") continue;
    if (estimate.rubHigh + 1000 < prev) {
      failed++;
      console.error(`ОШИБКА: комиссия упала на сумме ${fmt(amount)} (${JSON.stringify(p)}): ${fmt(estimate.rubHigh)} < ${fmt(prev)}`);
      break;
    }
    prev = estimate.rubHigh;
  }
}

// Инвариант 2: проценты всегда в рамках 7–15%, комиссия не ниже минимальной.
for (const amount of [100_000, 250_000, 1_000_000, 1_000_001, 3_000_000, 10_000_000, 30_000_000, 50_000_000, 50_000_001, 700_000_000]) {
  for (const history of ["good", "neutral", "closed_overdue", "bad", "severe"] as const) {
    const { estimate } = estimateCommission({ ...base, amount, history, debtLoad: "critical", arrests: "other" });
    if (estimate.kind !== "estimate") continue;
    if (estimate.percentLow < 7 || estimate.percentHigh > 15 || estimate.rubLow < 15_000) {
      failed++;
      console.error(`ОШИБКА: вне границ: ${amount} ${history}`, estimate);
    }
  }
}

console.log(failed === 0 ? "\nВсе проверки пройдены." : `\nПровалено проверок: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
