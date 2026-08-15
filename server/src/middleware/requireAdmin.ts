import type { Request, Response, NextFunction } from "express";
import { isAuthenticated } from "../lib/auth.js";

/** Защищает роуты /api/admin/* — требует валидную cookie-сессию (см. lib/auth.ts). */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ success: false, message: "Требуется авторизация" });
  }
  next();
}
