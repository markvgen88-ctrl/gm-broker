import { Router } from "express";
import type { Request, Response } from "express";
import { commissionRequestSchema } from "../lib/commissionValidation.js";
import { estimateCommission } from "../lib/commissionCalc.js";
import { calculatorRateLimiter } from "../middleware/rateLimit.js";

export const calculatorRouter = Router();

/**
 * Калькулятор ориентировочной комиссии для клиента.
 *
 * Формула и пороги остаются на сервере (src/lib/commissionConfig.ts): клиенту
 * уходит только вилка в процентах и рублях, пометки и признак «сложный кейс» —
 * без внутренних баллов. Ничего не сохраняется и не пересылается.
 */
calculatorRouter.post("/commission-estimate", calculatorRateLimiter, (req: Request, res: Response) => {
  const parsed = commissionRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Некорректные данные";
    return res.status(400).json({ success: false, message });
  }

  const { estimate } = estimateCommission(parsed.data);
  return res.status(200).json({ success: true, estimate });
});
