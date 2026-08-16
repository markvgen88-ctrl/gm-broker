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

/**
 * Атрибуты куки подбираются по фактическому запросу (HTTPS или нет), а не по
 * NODE_ENV — так надёжнее: на некоторых хостингах (например, если фронтенд
 * и сервер задеплоены как два разных приложения на разных доменах, как на
 * Timeweb App Platform) NODE_ENV может быть не выставлен, а куке всё равно
 * нужен правильный набор атрибутов.
 *
 * Если сайт и API на одном домене — достаточно SameSite=Lax. Если это два
 * разных домена (два отдельных приложения) — браузер отправит куку в
 * кросс-доменном запросе, только если SameSite=None и одновременно Secure
 * (это требование самих браузеров, не наша прихоть). req.secure корректно
 * определяет HTTPS благодаря "trust proxy" в index.ts.
 */
function cookieAttributes(req: Request) {
  const isHttps = req.secure;
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: (isHttps ? "none" : "lax") as "none" | "lax",
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: "/",
  };
}

export function issueSessionCookie(req: Request, res: Response): void {
  const token = jwt.sign({ role: "admin" }, getSessionSecret(), { expiresIn: SESSION_TTL_SECONDS });
  res.cookie(COOKIE_NAME, token, cookieAttributes(req));
}

export function clearSessionCookie(req: Request, res: Response): void {
  const { path, secure, sameSite } = cookieAttributes(req);
  res.clearCookie(COOKIE_NAME, { path, secure, sameSite });
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
