import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiArrowLeft, HiOutlineArrowRight, HiOutlineCheckCircle, HiOutlineInformationCircle } from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import { ServiceRequestForm } from "@/components/forms/ServiceRequestForm";
import type { SurveyAnswer } from "@/lib/api";
import type { Service } from "@/data/services";

/**
 * Мини-опрос перед заявкой на «Кредитные каникулы» (по XMind-карте
 * «Опрос по кредитным каникулам»):
 *
 *   старт → просрочка (да/нет — путь один) → арест счетов (да → отказ)
 *         → платежи в месяц → количество кредитов → условия услуги
 *         → (принимаю) контакты → заявка уходит как обычная заявка по услуге
 *
 * Ответы уходят вместе с заявкой в поле `answers` и попадают в письмо,
 * Telegram и CRM (раздел «Услуги»). Тексты вопросов ниже — ровно те, что
 * увидит брокер в заявке, поэтому правьте их здесь.
 * Если клиент упёрся в арест счетов или не принял условия, заявка не
 * отправляется — как у экранов отказа основной анкеты.
 */

type Step = "start" | "overdue" | "arrest" | "payments" | "count" | "terms" | "arrestDecline" | "termsDecline" | "contacts";

const Q = {
  overdue: "Есть ли в данный момент действующая просрочка по платежам?",
  arrest: "Наложен ли арест на банковские счета судебным приставом?",
  payments: "Общая сумма платежей в месяц по кредитам",
  count: "Количество действующих кредитных договоров",
  terms: "Условия услуги (предоплата, гарантия возврата, срок до 10 дней)",
} as const;

const TOTAL_STEPS = 5;
const STEP_NUMBER: Partial<Record<Step, number>> = { overdue: 1, arrest: 2, payments: 3, count: 4, terms: 5 };

const card = "rounded-3xl border border-white/10 bg-graphite p-6 md:p-10";
const title = "font-display text-xl font-semibold leading-snug text-silver md:text-2xl";
const hintCls = "mt-3 text-sm leading-relaxed text-metal md:text-base";
const optionCls =
  "group flex items-center justify-between gap-3 rounded-xl metal-border px-5 py-4 text-left text-sm font-medium text-silver transition-all duration-250 hover:border-gold/60 hover:bg-gold/[0.06] active:scale-[0.98] md:text-base";
const inputCls =
  "w-full rounded-xl border border-white/12 bg-graphite/60 px-5 py-4 pr-20 text-base text-silver placeholder:text-metal/50 transition-colors duration-250 focus:border-gold/60 focus:outline-none md:text-lg";
const backCls =
  "inline-flex items-center gap-2 text-sm font-medium text-metal transition-colors hover:text-gold";

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={backCls}>
      <HiArrowLeft /> Назад
    </button>
  );
}

function YesNo({ onAnswer }: { onAnswer: (yes: boolean) => void }) {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      {[
        { label: "Да", value: true },
        { label: "Нет", value: false },
      ].map((o) => (
        <button key={o.label} type="button" onClick={() => onAnswer(o.value)} className={optionCls}>
          {o.label}
          <HiOutlineArrowRight className="shrink-0 text-metal transition-all duration-250 group-hover:translate-x-1 group-hover:text-gold" />
        </button>
      ))}
    </div>
  );
}

function NumberStep({
  question,
  hint,
  suffix,
  placeholder,
  initial,
  integer,
  min,
  max,
  onSubmit,
  onBack,
}: {
  question: string;
  hint: string;
  suffix: string;
  placeholder: string;
  initial: string;
  integer?: boolean;
  min: number;
  max: number;
  onSubmit: (value: number) => void;
  onBack: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(value.replace(/\s/g, "").replace(",", "."));
    if (value.trim() === "" || Number.isNaN(n)) return setError("Введите число");
    if (integer && !Number.isInteger(n)) return setError("Введите целое число");
    if (n < min) return setError(`Минимум — ${min.toLocaleString("ru-RU")} ${suffix}`);
    if (n > max) return setError(`Максимум — ${max.toLocaleString("ru-RU")} ${suffix}`);
    onSubmit(n);
  };

  return (
    <form onSubmit={submit} noValidate>
      <h3 className={title}>{question}</h3>
      <p className={hintCls}>{hint}</p>
      <div className="relative mt-8">
        <input
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          inputMode={integer ? "numeric" : "decimal"}
          placeholder={placeholder}
          autoComplete="off"
          aria-label={question}
          className={inputCls}
        />
        <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm font-medium text-gold">
          {suffix}
        </span>
      </div>
      {error && <p className="mt-2 text-sm text-[#e5a3a3]">{error}</p>}
      <div className="mt-8 flex items-center justify-between gap-4">
        <BackButton onClick={onBack} />
        <Button type="submit">
          Далее
          <HiOutlineArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
        </Button>
      </div>
    </form>
  );
}

export function KanikulySurvey({ service }: { service: Service }) {
  const [step, setStep] = useState<Step>("start");
  const [history, setHistory] = useState<Step[]>([]);
  const [overdue, setOverdue] = useState<boolean | null>(null);
  const [payments, setPayments] = useState<number | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [sent, setSent] = useState(false);

  const goTo = (next: Step) => {
    setHistory((h) => [...h, step]);
    setStep(next);
  };
  const goBack = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory(history.slice(0, -1));
    setStep(prev);
  };
  const restart = () => {
    setHistory([]);
    setStep("start");
    setOverdue(null);
    setPayments(null);
    setCount(null);
  };

  const answers: SurveyAnswer[] = [
    { question: Q.overdue, answer: overdue ? "Да" : "Нет" },
    { question: Q.arrest, answer: "Нет" },
    { question: Q.payments, answer: `${(payments ?? 0).toLocaleString("ru-RU")} ₽` },
    { question: Q.count, answer: String(count ?? 0) },
    { question: Q.terms, answer: "Принимает условия" },
  ];

  const stepNumber = STEP_NUMBER[step];

  let body: ReactNode;

  switch (step) {
    case "start":
      body = (
        <div>
          <h3 className={title}>Узнайте, можно ли для вас оформить кредитные каникулы.</h3>
          <p className={hintCls}>Пройдите небольшой опрос — это займёт около минуты.</p>
          <div className="mt-8">
            <Button size="lg" onClick={() => goTo("overdue")}>
              Начать
              <HiOutlineArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      );
      break;

    case "overdue":
      body = (
        <div>
          <h3 className={title}>{Q.overdue}</h3>
          <YesNo
            onAnswer={(yes) => {
              setOverdue(yes);
              goTo("arrest");
            }}
          />
          <div className="mt-8">
            <BackButton onClick={goBack} />
          </div>
        </div>
      );
      break;

    case "arrest":
      body = (
        <div>
          <h3 className={title}>{Q.arrest}</h3>
          <YesNo onAnswer={(yes) => goTo(yes ? "arrestDecline" : "payments")} />
          <div className="mt-8">
            <BackButton onClick={goBack} />
          </div>
        </div>
      );
      break;

    case "payments":
      body = (
        <NumberStep
          question="Укажите общую сумму платежей в месяц по кредитам."
          hint="Сложите ежемесячные платежи по всем действующим кредитам."
          suffix="₽"
          placeholder="Например, 80 000"
          initial={payments !== null ? String(payments) : ""}
          min={1}
          max={100_000_000}
          onSubmit={(n) => {
            setPayments(n);
            goTo("count");
          }}
          onBack={goBack}
        />
      );
      break;

    case "count":
      body = (
        <NumberStep
          question="Укажите количество действующих кредитных договоров."
          hint="Считайте каждый договор отдельно: ипотека, потребительские кредиты, автокредит и т. д."
          suffix="шт."
          placeholder="Например, 3"
          initial={count !== null ? String(count) : ""}
          integer
          min={1}
          max={99}
          onSubmit={(n) => {
            setCount(n);
            goTo("terms");
          }}
          onBack={goBack}
        />
      );
      break;

    case "terms":
      body = (
        <div>
          <div className="flex items-center gap-3 text-gold">
            <HiOutlineCheckCircle size={32} className="shrink-0" />
            <h3 className={title}>Вам можно оформить кредитные каникулы!</h3>
          </div>
          <p className="mt-5 text-sm font-semibold text-silver md:text-base">Важно:</p>
          <ul className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-metal md:text-base">
            {[
              "Оплата услуги осуществляется только по предоплате. Вы можете выбрать, какие кредиты остановить, а какие оставить.",
              "Со своей стороны даём гарантию на возврат средств, если услуга не будет оказана.",
              "Срок оказания услуги — до 10 дней, в зависимости от количества кредитных договоров.",
              "Сумма определяется после анализа кредитной истории. Для этого вам необходимо будет запросить её в трёх кредитных бюро — ссылки на сервисы пришлём в ответе на вашу заявку.",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-silver md:text-base">Если условия вам подходят, нажмите соответствующую кнопку.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button size="lg" onClick={() => goTo("contacts")}>
              Да, принимаю
            </Button>
            <Button size="lg" variant="secondary" onClick={() => goTo("termsDecline")}>
              Нет, не подходят
            </Button>
          </div>
          <div className="mt-8">
            <BackButton onClick={goBack} />
          </div>
        </div>
      );
      break;

    case "arrestDecline":
    case "termsDecline":
      body = (
        <div className="flex flex-col items-center py-4 text-center">
          <div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-white/5 text-metal">
            <HiOutlineInformationCircle size={36} />
          </div>
          <h3 className={title}>
            {step === "arrestDecline"
              ? "К сожалению, для вас каникулы открыть сможем только после снятия ареста по счетам."
              : "Спасибо, что прошли опрос! Если захотите вернуться к этому вопросу, мы будем рады помочь."}
          </h3>
          <div className="mt-8 flex items-center gap-4">
            <BackButton onClick={goBack} />
            <Button variant="secondary" onClick={restart}>
              Пройти опрос заново
            </Button>
          </div>
        </div>
      );
      break;

    case "contacts":
      body = (
        <div>
          {!sent && (
            <>
              <h3 className={title}>Спасибо, что прошли опрос!</h3>
              <p className={`${hintCls} mb-6`}>
                Оставьте контакты — мы изучим вашу анкету и ответим в течение 24 часов.
              </p>
            </>
          )}
          <ServiceRequestForm service={service} answers={answers} onSubmitted={() => setSent(true)} />
          {!sent && (
            <div className="mt-6">
              <BackButton onClick={goBack} />
            </div>
          )}
        </div>
      );
      break;
  }

  // На последнем шаге форма сама рисует рамку, поэтому внешняя карточка нужна только остальным шагам.
  const framed = step !== "contacts";

  return (
    <div className={framed ? card : undefined}>
      {stepNumber && (
        <p className="mb-5 text-xs font-medium uppercase tracking-wider text-metal">
          Вопрос {stepNumber} из {TOTAL_STEPS}
        </p>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {body}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
