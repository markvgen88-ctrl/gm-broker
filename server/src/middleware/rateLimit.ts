import rateLimit from "express-rate-limit";

/**
 * Ограничивает количество заявок с одного IP, чтобы защититься
 * от спама и случайных повторных отправок формы.
 */
export const submitRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 минут
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Слишком много заявок с вашего IP. Попробуйте позже.",
  },
});
