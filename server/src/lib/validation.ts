import { z } from "zod";

export const submissionSchema = z.object({
  clientType: z.enum(["individual", "entrepreneur", "legal_entity"]),
  submittedAt: z.string().min(1),
  answers: z
    .record(z.string(), z.union([z.string(), z.number()]))
    .refine((a) => typeof a.name === "string" && a.name.trim().length >= 2, {
      message: "Укажите имя (не менее 2 символов)",
    })
    .refine((a) => typeof a.contactInfo === "string" && a.contactInfo.trim().length >= 5, {
      message: "Укажите корректный способ связи",
    }),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
