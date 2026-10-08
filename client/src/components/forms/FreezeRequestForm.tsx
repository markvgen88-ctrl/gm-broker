import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { HiOutlineCheckCircle } from "react-icons/hi";
import { cta } from "@/lib/cta";
import { submitFreezeRequest } from "@/lib/api";

const PHONE_REGEX = /^(\+7|8|7)?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;

const schema = z.object({
  name: z.string().trim().min(2, "Укажите имя").max(120, "Слишком длинное имя"),
  phone: z.string().trim().regex(PHONE_REGEX, "Укажите корректный номер телефона"),
  email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Укажите корректный e-mail"),
  comment: z.string().trim().max(2000, "Комментарий слишком длинный (до 2000 символов)"),
  consent: z.boolean().refine((v) => v === true, "Нужно согласие на обработку персональных данных"),
  website: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const inputCls =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-base text-white placeholder:text-white/40 transition-colors focus:border-pine-bright focus:outline-none";
const labelCls = "mb-2 block text-sm font-medium text-white/70";
const errCls = "mt-1.5 text-sm text-[#f0b4b4]";

/** Форма заявки на «заморозку кредитного договора». Светлый текст — форма стоит на тёмном фоне. */
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
        email: values.email || undefined,
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
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center md:p-10" role="status">
        <HiOutlineCheckCircle className="mx-auto text-pine-bright" size={48} />
        <h3 className="mt-4 font-display text-2xl font-bold text-white">Заявка отправлена</h3>
        <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-white/70">
          Свяжемся с вами, обсудим вашу ситуацию и скажем, возможна ли отсрочка по вашим кредитам.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="fr-name" className={labelCls}>
            Имя
          </label>
          <input id="fr-name" type="text" autoComplete="name" placeholder="Как к вам обращаться" className={inputCls} {...register("name")} />
          {errors.name && <p className={errCls}>{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="fr-phone" className={labelCls}>
            Телефон
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
      </div>

      <div className="mt-5">
        <label htmlFor="fr-email" className={labelCls}>
          E-mail <span className="text-white/40">(по желанию)</span>
        </label>
        <input id="fr-email" type="email" autoComplete="email" inputMode="email" placeholder="Адрес электронной почты" className={inputCls} {...register("email")} />
        {errors.email && <p className={errCls}>{errors.email.message}</p>}
      </div>

      <div className="mt-5">
        <label htmlFor="fr-comment" className={labelCls}>
          Комментарий <span className="text-white/40">(по желанию)</span>
        </label>
        <textarea
          id="fr-comment"
          rows={4}
          placeholder="Какие кредиты, какой ежемесячный платёж, что хотите решить"
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

      <div className="mt-6">
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-white/70">
          <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#34c49a]" {...register("consent")} />
          <span>
            Я даю согласие на обработку персональных данных и их передачу исполнителю услуги в соответствии с{" "}
            <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-pine-bright underline underline-offset-2">
              Политикой конфиденциальности
            </Link>
          </span>
        </label>
        {errors.consent && <p className={errCls}>{errors.consent.message}</p>}
      </div>

      {submitError && (
        <p className="mt-5 rounded-lg border border-[#f0b4b4]/30 bg-[#f0b4b4]/10 px-4 py-3 text-sm text-[#f0b4b4]">{submitError}</p>
      )}

      <button type="submit" disabled={isSubmitting} className={cta("bright", "lg", "mt-7 w-full sm:w-auto")}>
        {isSubmitting ? "Отправляем…" : "Отправить заявку"}
      </button>
    </form>
  );
}
