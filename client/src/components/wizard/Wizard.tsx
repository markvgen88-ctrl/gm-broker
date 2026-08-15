import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import type { FinalNode } from "@/types/questionnaire";

// Достаточно гибкий формат российского номера: допускает +7/8/7, пробелы,
// скобки и дефисы — например «+7 (926) 123-45-67», «89261234567», «7 926 1234567».
const PHONE_REGEX = /^(\+7|8|7)?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;

const finalSchema = z.object({
  name: z.string().trim().min(2, "Укажите, как к вам обращаться"),
  phone: z
    .string()
    .trim()
    .min(10, "Укажите номер телефона для связи")
    .regex(PHONE_REGEX, "Укажите корректный номер телефона"),
  contactInfo: z.string().trim().email("Укажите корректный e-mail"),
  consent: z.boolean().refine((v) => v === true, {
    message: "Нужно согласие на обработку персональных данных, чтобы продолжить",
  }),
});

export type FinalFormValues = z.infer<typeof finalSchema>;

interface FinalStepProps {
  node: FinalNode;
  onSubmit: (values: FinalFormValues) => void;
  onBack: () => void;
  isSubmitting: boolean;
  submitError: string | null;
}

export function FinalStep({ node, onSubmit, onBack, isSubmitting, submitError }: FinalStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FinalFormValues>({
    resolver: zodResolver(finalSchema),
    defaultValues: { name: "", phone: "", contactInfo: "", consent: false },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h3 className="font-display text-xl font-semibold leading-snug text-silver md:text-2xl">
        {node.question}
      </h3>
      {node.hint && <p className="mt-3 text-sm leading-relaxed text-metal md:text-base">{node.hint}</p>}

      <div className="mt-8 grid gap-5">
        <div>
          <label htmlFor="name" className="mb-2 block text-xs font-medium uppercase tracking-wider text-metal">
            Имя
          </label>
          <input
            id="name"
            autoComplete="name"
            placeholder="Как к вам обращаться"
            className="w-full rounded-xl border border-white/12 bg-graphite/60 px-5 py-4 text-base text-silver placeholder:text-metal/50 transition-colors duration-250 focus:border-gold/60 focus:outline-none"
            {...register("name")}
          />
          {errors.name && <p className="mt-2 text-sm text-[#e5a3a3]">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="mb-2 block text-xs font-medium uppercase tracking-wider text-metal">
            Номер телефона
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+7 (___) ___-__-__"
            className="w-full rounded-xl border border-white/12 bg-graphite/60 px-5 py-4 text-base text-silver placeholder:text-metal/50 transition-colors duration-250 focus:border-gold/60 focus:outline-none"
            {...register("phone")}
          />
          {errors.phone && <p className="mt-2 text-sm text-[#e5a3a3]">{errors.phone.message}</p>}
        </div>

        <div>
          <label htmlFor="contactInfo" className="mb-2 block text-xs font-medium uppercase tracking-wider text-metal">
            E-mail
          </label>
          <input
            id="contactInfo"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="Укажите ваш актуальный адрес эл. почты"
            className="w-full rounded-xl border border-white/12 bg-graphite/60 px-5 py-4 text-base text-silver placeholder:text-metal/50 transition-colors duration-250 focus:border-gold/60 focus:outline-none"
            {...register("contactInfo")}
          />
          {errors.contactInfo && <p className="mt-2 text-sm text-[#e5a3a3]">{errors.contactInfo.message}</p>}
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-metal">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 accent-gold"
              {...register("consent")}
            />
            <span>
              Я даю согласие на обработку персональных данных в соответствии с{" "}
              <Link
                to="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold underline underline-offset-2 hover:text-gold-deep"
                onClick={(e) => e.stopPropagation()}
              >
                Политикой конфиденциальности
              </Link>
            </span>
          </label>
          {errors.consent && <p className="mt-2 text-sm text-[#e5a3a3]">{errors.consent.message}</p>}
        </div>
      </div>

      {submitError && (
        <p className="mt-5 rounded-lg border border-[#e5a3a3]/30 bg-[#e5a3a3]/10 px-4 py-3 text-sm text-[#e5a3a3]">
          {submitError}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-metal transition-colors hover:text-gold"
        >
          <HiArrowLeft /> Назад
        </button>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Отправляем…" : "Отправить заявку"}
        </Button>
      </div>
    </form>
  );
}
