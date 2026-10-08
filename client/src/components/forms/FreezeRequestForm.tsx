import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { HiOutlineCheckCircle } from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import { submitFreezeRequest } from "@/lib/api";

// Тот же формат телефона и те же правила, что в анкете (FinalStep).
const PHONE_REGEX = /^(\+7|8|7)?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;

const schema = z.object({
  name: z.string().trim().min(2, "Укажите, как к вам обращаться"),
  phone: z
    .string()
    .trim()
    .min(10, "Укажите номер телефона для связи")
    .regex(PHONE_REGEX, "Укажите корректный номер телефона"),
  email: z.string().trim().email("Укажите корректный e-mail"),
  comment: z.string().trim().max(2000, "Комментарий слишком длинный (до 2000 символов)"),
  consent: z.boolean().refine((v) => v === true, {
    message: "Нужно согласие на обработку персональных данных, чтобы продолжить",
  }),
  website: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const labelCls = "mb-2 block text-xs font-medium uppercase tracking-wider text-metal";
const inputCls =
  "w-full rounded-xl border border-white/12 bg-graphite/60 px-5 py-4 text-base text-silver placeholder:text-metal/50 transition-colors duration-250 focus:border-gold/60 focus:outline-none";
const errCls = "mt-2 text-sm text-[#e5a3a3]";

/**
 * Форма заявки на «заморозку кредитного договора». Оформление и поля — как на
 * последнем шаге опроса (FinalStep), плюс необязательный комментарий.
 * Рассчитана на тёмный фон со скином `.wizard-skin`.
 */
export function FreezeRequestForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", email: "", comment: "", consent: false, website: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await submitFreezeRequest({
        name: values.name,
        phone: values.phone,
        email: values.email,
        comment: values.comment || undefined,
        consent: true,
        website: values.website,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Не удалось отправить заявку. Попробуйте ещё раз.");
    }
  };

  if (submitted) {
    return (
      <div className="rounded-3xl border border-white/10 bg-graphite p-8 text-center md:p-10" role="status">
        <HiOutlineCheckCircle className="mx-auto text-gold" size={48} />
        <h3 className="mt-4 font-display text-2xl font-semibold text-silver">Заявка отправлена</h3>
        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-metal">
          Свяжемся с вами, обсудим вашу ситуацию и скажем, возможна ли отсрочка по вашим кредитам.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="relative rounded-3xl border border-white/10 bg-graphite p-6 md:p-10"
    >
      <div className="grid gap-5">
        <div>
          <label htmlFor="fr-name" className={labelCls}>
            Имя
          </label>
          <input
            id="fr-name"
            autoComplete="name"
            placeholder="Как к вам обращаться"
            className={inputCls}
            {...register("name")}
          />
          {errors.name && <p className={errCls}>{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="fr-phone" className={labelCls}>
            Номер телефона
          </label>
          <input
            id="fr-phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+7 (___) ___-__-__"
            className={inputCls}
            {...register("phone")}
          />
          {errors.phone && <p className={errCls}>{errors.phone.message}</p>}
        </div>

        <div>
          <label htmlFor="fr-email" className={labelCls}>
            E-mail
          </label>
          <input
            id="fr-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="Укажите ваш актуальный адрес эл. почты"
            className={inputCls}
            {...register("email")}
          />
          {errors.email && <p className={errCls}>{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="fr-comment" className={labelCls}>
            Комментарий
          </label>
          <textarea
            id="fr-comment"
            rows={4}
            placeholder="Какие кредиты, какой ежемесячный платёж, что хотите решить (по желанию)"
            className={inputCls}
            {...register("comment")}
          />
          {errors.comment && <p className={errCls}>{errors.comment.message}</p>}
        </div>

        {/* Ловушка для ботов: скрыта от людей и от скринридеров */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="fr-website">Сайт</label>
          <input id="fr-website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-metal">
            <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-gold" {...register("consent")} />
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
          {errors.consent && <p className={errCls}>{errors.consent.message}</p>}
        </div>
      </div>

      {submitError && (
        <p className="mt-5 rounded-lg border border-[#e5a3a3]/30 bg-[#e5a3a3]/10 px-4 py-3 text-sm text-[#e5a3a3]">
          {submitError}
        </p>
      )}

      <div className="mt-8 flex justify-end">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Отправляем…" : "Отправить заявку"}
        </Button>
      </div>
    </form>
  );
}
