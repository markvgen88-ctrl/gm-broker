import crypto from "node:crypto";
import type { Request, Response } from "express";
import { createSession, deleteSession, deleteExpiredSessions, getSession } from "./db.js";

export const ADMIN_COOKIE_NAME = "gmb_admin_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 дней — потом нужно будет войти заново

/** Сравнение постоянной длины по времени — чтобы нельзя было подобрать пароль по времени ответа. */
function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Всё равно выполняем сравнение той же формы, чтобы не "утекало" время ответа
    // при разной длине пароля.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// ==================== ПАРОЛЬ ДЛЯ ВХОДА В /admin ====================
// Чтобы поменять пароль — просто отредактируйте строку ниже и пересоберите
// сервер (npm run build). Никаких .env для этого не требуется.
export const ADMIN_PASSWORD = "123456789";
// =====================================================================

export function checkAdminPassword(candidate: string): boolean {
  return timingSafeEqualStr(candidate, ADMIN_PASSWORD);
}

function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    // В проде фронтенд и API обычно на разных поддоменах/доменах — нужен sameSite "none" + secure,
    // иначе браузер не отправит cookie при кросс-доменном запросе.
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "none" | "lax",
    maxAge: SESSION_TTL_MS,
    path: "/",
  };
}

export function issueSession(res: Response): void {
  deleteExpiredSessions();
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  createSession(token, now.toISOString(), expiresAt.toISOString());
  res.cookie(ADMIN_COOKIE_NAME, token, cookieOptions());
}

export function clearSession(req: Request, res: Response): void {
  const token = req.cookies?.[ADMIN_COOKIE_NAME];
  if (typeof token === "string" && token) {
    deleteSession(token);
  }
  res.clearCookie(ADMIN_COOKIE_NAME, { path: "/" });
}

export function isAuthenticated(req: Request): boolean {
  const token = req.cookies?.[ADMIN_COOKIE_NAME];
  if (typeof token !== "string" || !token) return false;

  const session = getSession(token);
  if (!session) return false;

  if (new Date(session.expires_at).getTime() < Date.now()) {
    deleteSession(token);
    return false;
  }

  return true;
}
