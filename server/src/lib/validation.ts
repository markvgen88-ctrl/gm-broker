import { z } from "zod";

// Тот же формат, что и на клиенте (client/src/components/wizard/FinalStep.tsx) —
// допускает +7/8/7, пробелы, скобки и дефисы.
const PHONE_REGEX = /^(\+7|8|7)?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;

export const submissionSchema = z.object({
  clientType: z.enum(["individual", "entrepreneur", "legal_entity"]),
  submittedAt: z.string().min(1),
  answers: z
    .record(z.string(), z.union([z.string(), z.number()]))
    .refine((a) => typeof a.name === "string" && a.name.trim().length >= 2, {
      message: "Укажите имя (не менее 2 символов)",
    })
    .refine((a) => typeof a.phone === "string" && PHONE_REGEX.test(a.phone.trim()), {
      message: "Укажите корректный номер телефона",
    })
    .refine((a) => typeof a.contactInfo === "string" && z.string().email().safeParse(a.contactInfo.trim()).success, {
      message: "Укажите корректный e-mail",
    }),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
