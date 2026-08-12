import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import type { FinalNode } from "@/types/questionnaire";

const finalSchema = z.object({
  name: z.string().trim().min(2, "Укажите, как к вам обращаться"),
  contactInfo: z.string().trim().min(5, "Укажите телефон, e-mail или Telegram"),
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
    defaultValues: { name: "", contactInfo: "", consent: false },
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
          <label htmlFor="contactInfo" className="mb-2 block text-xs font-medium uppercase tracking-wider text-metal">
            Телефон, e-mail или Telegram
          </label>
          <input
            id="contactInfo"
            autoComplete="tel"
            placeholder="+7 900 000-00-00 / @username / mail@example.com"
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
