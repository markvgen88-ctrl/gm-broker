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

/**
 * Отдельный, более строгий лимит на попытки входа в CRM — единственный
 * пароль защищает персональные данные клиентов (ФИО, телефоны, доходы),
 * поэтому подбор пароля должен быть максимально затруднён.
 */
export const adminLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Слишком много попыток входа. Попробуйте позже.",
  },
});
