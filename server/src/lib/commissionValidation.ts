import { z } from "zod";
import { commissionConfig } from "./commissionConfig.js";

const { minAmount, maxAmount } = commissionConfig;

/**
 * Входные данные калькулятора комиссии. Все поля — выбор из готовых
 * вариантов, кроме суммы кредита и (при наличии залога) его стоимости.
 */
export const commissionRequestSchema = z
  .object({
    amount: z
      .number({ message: "Укажите сумму кредита" })
      .finite()
      .min(minAmount, `Расчёт доступен для сумм от ${minAmount.toLocaleString("ru-RU")} ₽`)
      .max(maxAmount, "Слишком большая сумма"),
    mortgage: z.boolean(),
    history: z.enum(["good", "neutral", "closed_overdue", "bad", "severe"]),
    debtLoad: z.enum(["normal", "high", "critical"]),
    collateral: z.enum(["none", "simple", "complex"]),
    collateralValue: z.number().finite().min(0).max(maxAmount * 10).optional(),
    arrests: z.enum(["none", "on_collateral", "other"]),
    multipleBorrowers: z.boolean(),
  })
  .refine((v) => v.collateral === "none" || (v.collateralValue ?? 0) > 0, {
    message: "Укажите примерную стоимость залога",
    path: ["collateralValue"],
  });

export type CommissionRequest = z.infer<typeof commissionRequestSchema>;
