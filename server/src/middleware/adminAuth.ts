import { timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

const COOKIE_NAME = "gmb_admin_session";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 дней

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET не задан в .env — вход в CRM невозможен.");
  }
  return secret;
}

/** Сравнение пароля за постоянное время — защита от timing-атак. */
export function verifyAdminPassword(candidate: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (typeof candidate !== "string" || !expected) return false;

  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function issueSessionCookie(res: Response): void {
  const token = jwt.sign({ role: "admin" }, getSessionSecret(), { expiresIn: SESSION_TTL_SECONDS });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

/** Пропускает дальше только запросы с валидной сессионной кукой. */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ success: false, message: "Не авторизовано" });
    return;
  }
  try {
    jwt.verify(token, getSessionSecret());
    next();
  } catch {
    res.status(401).json({ success: false, message: "Сессия истекла — войдите заново" });
  }
}
