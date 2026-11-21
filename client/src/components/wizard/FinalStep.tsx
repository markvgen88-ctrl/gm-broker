import { Fragment, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { HiArrowLeft, HiCheck } from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import { ContactNotice } from "@/components/ui/ContactNotice";
import { CONTACT_EMAIL } from "@/data/contact";
import { checkRepeatApplication } from "@/lib/api";
import { normalizeTelegram, TELEGRAM_ERROR } from "@/lib/telegram";
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
  telegram: z.string().trim().max(120).refine((v) => normalizeTelegram(v) !== null, TELEGRAM_ERROR),
  consent: z.boolean().refine((v) => v === true, {
    message: "Нужно согласие на обработку персональных данных, чтобы продолжить",
  }),
});

export type FinalFormValues = z.infer<typeof finalSchema>;

/** Текст сообщения, в котором адрес почты превращён в ссылку — чтобы можно было сразу нажать и написать письмо. */
function MessageWithEmailLink({ text }: { text: string }) {
  const parts = text.split(CONTACT_EMAIL);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Запрос статуса заявки")}`}
              className="font-medium underline underline-offset-2 hover:text-white"
            >
              {CONTACT_EMAIL}
            </a>
          )}
          {part}
        </Fragment>
      ))}
    </>
  );
}

const makeContactsKey = (phone: string, email: string) => `${phone.trim()}|${email.trim().toLowerCase()}`;

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
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<FinalFormValues>({
    resolver: zodResolver(finalSchema),
    defaultValues: { name: "", phone: "", contactInfo: "", telegram: "", consent: false },
  });

  // Согласие даётся кнопкой «Согласен»: она проверяет, можно ли этому клиенту
  // сейчас подать заявку. Сам чекбокс скрыт и ставится программно.
  const [checking, setChecking] = useState(false);
  const [consentProblem, setConsentProblem] = useState<string | null>(null);
  const [checkedKey, setCheckedKey] = useState<string | null>(null);

  const consent = watch("consent");
  const contactsKey = makeContactsKey(watch("phone"), watch("contactInfo"));

  // Если после проверки клиент поправил телефон или e-mail — согласие сбрасывается,
  // и проверку нужно пройти заново.
  useEffect(() => {
    if (checkedKey === contactsKey) return;
    if (getValues("consent")) setValue("consent", false);
    setCheckedKey(null);
    setConsentProblem(null);
  }, [contactsKey, checkedKey, getValues, setValue]);

  const handleConsentClick = async () => {
    setConsentProblem(null);
    const contactsValid = await trigger(["phone", "contactInfo"]);
    if (!contactsValid) return;

    const startedKey = makeContactsKey(getValues("phone"), getValues("contactInfo"));
    setChecking(true);
    try {
      const result = await checkRepeatApplication(getValues("phone").trim(), getValues("contactInfo").trim());
      // Пока шла проверка, клиент мог изменить контакты — тогда результат не годится.
      if (makeContactsKey(getValues("phone"), getValues("contactInfo")) !== startedKey) return;
      if (!result.allowed) {
        setConsentProblem(result.message ?? "Заявку с этими контактными данными сейчас подать нельзя.");
        return;
      }
      setCheckedKey(startedKey);
      setValue("consent", true, { shouldValidate: true });
    } catch (error) {
      setConsentProblem(error instanceof Error ? error.message : "Не удалось выполнить проверку. Попробуйте ещё раз.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h3 className="font-display text-xl font-semibold leading-snug text-silver md:text-2xl">
        {node.question}
      </h3>
      {node.hint && <p className="mt-3 text-sm leading-relaxed text-metal md:text-base">{node.hint}</p>}

      <ContactNotice className="mt-5" />

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
          <label htmlFor="telegram" className="mb-2 block text-xs font-medium uppercase tracking-wider text-metal">
            Telegram <span className="normal-case tracking-normal text-metal/60">— если есть</span>
          </label>
          <input
            id="telegram"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="@username или ссылка t.me/…"
            className="w-full rounded-xl border border-white/12 bg-graphite/60 px-5 py-4 text-base text-silver placeholder:text-metal/50 transition-colors duration-250 focus:border-gold/60 focus:outline-none"
            {...register("telegram")}
          />
          {errors.telegram && <p className="mt-2 text-sm text-[#e5a3a3]">{errors.telegram.message}</p>}
        </div>

        <div>
          <div className="flex items-start gap-3 text-sm leading-relaxed text-metal">
            {/* Настоящий чекбокс скрыт: его ставит кнопка «Согласен» после успешной проверки. */}
            <input type="checkbox" tabIndex={-1} aria-hidden="true" className="sr-only" {...register("consent")} />
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center" aria-live="polite">
              {consent && (
                <span
                  className="flex h-5 w-5 items-center justify-center rounded bg-gold text-[#1a1400]"
                  role="img"
                  aria-label="Согласие дано"
                >
                  <HiCheck className="h-4 w-4" />
                </span>
              )}
            </span>
            <span>
              Я даю согласие на обработку персональных данных в соответствии с{" "}
              <Link
                to="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold underline underline-offset-2 hover:text-gold-deep"
              >
                Политикой конфиденциальности
              </Link>
            </span>
          </div>
          {!consent && (
            <div className="mt-3 pl-8">
              <Button type="button" variant="secondary" size="sm" onClick={handleConsentClick} disabled={checking}>
                {checking ? "Проверяем…" : "Согласен"}
              </Button>
            </div>
          )}
          {consentProblem && (
            <p className="mt-3 rounded-lg border border-[#e5a3a3]/30 bg-[#e5a3a3]/10 px-4 py-3 text-sm text-[#e5a3a3]">
              <MessageWithEmailLink text={consentProblem} />
            </p>
          )}
          {errors.consent && !consentProblem && (
            <p className="mt-2 text-sm text-[#e5a3a3]">Нажмите «Согласен», чтобы продолжить</p>
          )}
        </div>
      </div>

      {submitError && (
        <p className="mt-5 rounded-lg border border-[#e5a3a3]/30 bg-[#e5a3a3]/10 px-4 py-3 text-sm text-[#e5a3a3]">
          <MessageWithEmailLink text={submitError} />
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
        <Button type="submit" size="lg" disabled={isSubmitting || !consent}>
          {isSubmitting ? "Отправляем…" : "Отправить заявку"}
        </Button>
      </div>
    </form>
  );
}
