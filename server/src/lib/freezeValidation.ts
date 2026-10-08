import { z } from "zod";

// Тот же формат телефона, что в анкете.
const PHONE_REGEX = /^(\+7|8|7)?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;

/**
 * Заявка на «заморозку кредитного договора»: имя, телефон, e-mail (как в
 * анкете), необязательный комментарий, согласие. Поле `website` — «ловушка» для ботов:
 * человек его не видит и не заполняет.
 */
export const freezeRequestSchema = z.object({
  name: z.string().trim().min(2, "Укажите имя").max(120, "Слишком длинное имя"),
  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, "Укажите корректный номер телефона"),
  email: z.string().trim().max(160).email("Укажите корректный e-mail"),
  comment: z.string().trim().max(2000, "Комментарий слишком длинный (до 2000 символов)").optional(),
  consent: z.literal(true, { message: "Нужно согласие на обработку персональных данных" }),
  website: z.string().max(200).optional(),
});

export type FreezeRequestInput = z.infer<typeof freezeRequestSchema>;
