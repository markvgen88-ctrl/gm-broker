import { useState } from "react";
import type { ReactNode } from "react";
import {
  requestCommissionEstimate,
  type ArrestsKind,
  type CollateralKind,
  type CommissionEstimate,
  type CreditHistory,
  type DebtLoad,
  type EstimateNote,
} from "@/lib/api";
import { CALCULATOR_GOALS, reachGoal } from "@/lib/metrika";
import { cn } from "@/lib/utils";
import { cta } from "@/lib/cta";
import { SurveyLink } from "@/components/ui/SurveyLink";

type ClientKind = "individual" | "entrepreneur" | "business";

const MIN_AMOUNT = 100_000;

const DEBT_OPTIONS: { value: DebtLoad; label: string }[] = [
  { value: "normal", label: "До 40% или кредитов нет" },
  { value: "high", label: "От 40% до 60%" },
  { value: "critical", label: "Больше 60%" },
];

const HISTORY_OPTIONS: { value: CreditHistory; label: string; hint?: string }[] = [
  { value: "good", label: "Хорошая", hint: "Просрочек не было" },
  { value: "neutral", label: "Обычная", hint: "Без серьёзных проблем" },
  { value: "closed_overdue", label: "Были просрочки, но они закрыты" },
  { value: "bad", label: "Плохая", hint: "Много просрочек или частые отказы" },
  { value: "severe", label: "Тяжёлая", hint: "Есть действующие просрочки" },
];

const COLLATERAL_OPTIONS: { value: CollateralKind; label: string; hint?: string }[] = [
  { value: "none", label: "Нет залога" },
  { value: "simple", label: "Да, один объект", hint: "Например, квартира, один собственник" },
  {
    value: "complex",
    label: "Да, сложный залог",
    hint: "Несколько объектов или собственников, коммерческая недвижимость, залог третьего лица",
  },
];

const NOTE_TEXTS: Record<EstimateNote, string> = {
  collateral_arrested: "Залог под арестом в расчёте не учтён. После снятия ареста стоимость может снизиться.",
  collateral_not_counted:
    "Сумма кредита велика относительно стоимости залога, поэтому залог в расчёте не учтён.",
  collateral_partial: "Залог учтён частично: это зависит от доли кредита в стоимости залога и от долговой нагрузки.",
  arrests_check: "Аресты на другое имущество потребуют дополнительной юридической проверки.",
};

function parseMoney(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

function formatMoneyInput(value: number): string {
  return value > 0 ? new Intl.NumberFormat("ru-RU").format(value) : "";
}

function formatRub(n: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(n)} ₽`;
}

function formatPercent(n: number): string {
  return `${String(n).replace(".", ",")}%`;
}

function Fieldset({ legend, hint, children }: { legend: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="font-display text-lg font-semibold leading-snug text-ink">{legend}</legend>
      {hint && <p className="mt-1 text-sm leading-relaxed text-muted">{hint}</p>}
      <div className="mt-3">{children}</div>
    </fieldset>
  );
}

interface ChoiceProps<T extends string> {
  name: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
  columns?: 1 | 2 | 3;
}

function Choices<T extends string>({ name, value, onChange, options, columns = 1 }: ChoiceProps<T>) {
  return (
    <div
      className={cn(
        "grid gap-2.5",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-3"
      )}
      role="radiogroup"
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <label
            key={o.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition-colors",
              active ? "border-pine bg-mint" : "border-line bg-white hover:border-ink/40"
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={active}
              onChange={() => onChange(o.value)}
              className="mt-1 h-4 w-4 shrink-0 accent-[#0d6150]"
            />
            <span className="min-w-0">
              <span className="block text-[0.95rem] font-medium leading-snug text-ink">{o.label}</span>
              {o.hint && <span className="mt-0.5 block text-sm leading-snug text-muted">{o.hint}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}

const inputCls =
  "w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-base text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-pine";

export function CommissionCalculator() {
  const [amountRaw, setAmountRaw] = useState("");
  const [purpose, setPurpose] = useState<"mortgage" | "other">("other");
  const [clientKind, setClientKind] = useState<ClientKind>("individual");
  const [history, setHistory] = useState<CreditHistory>("neutral");
  const [debtLoad, setDebtLoad] = useState<DebtLoad>("normal");
  const [collateral, setCollateral] = useState<CollateralKind>("none");
  const [collateralValueRaw, setCollateralValueRaw] = useState("");
  const [arrests, setArrests] = useState<ArrestsKind>("none");
  const [multipleBorrowers, setMultipleBorrowers] = useState(false);

  const [estimate, setEstimate] = useState<CommissionEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const amount = parseMoney(amountRaw);
  const collateralValue = parseMoney(collateralValueRaw);
  const isMortgage = purpose === "mortgage";

  const debtLegend =
    clientKind === "individual"
      ? "Какую часть дохода занимают ежемесячные платежи по кредитам?"
      : "Какую часть среднемесячной выручки занимают ежемесячные платежи по кредитам?";

  const arrestOptions: { value: ArrestsKind; label: string; hint?: string }[] = [
    { value: "none", label: "Нет" },
    ...(collateral !== "none"
      ? [
          {
            value: "on_collateral" as ArrestsKind,
            label: "Есть арест или запрет на имущество, которое пойдёт в залог",
          },
        ]
      : []),
    {
      value: "other",
      label: "Есть аресты на другое имущество или счета, либо исполнительные производства",
    },
  ];

  const resetResult = () => {
    setEstimate(null);
    setError(null);
  };

  const handleCollateral = (v: CollateralKind) => {
    setCollateral(v);
    if (v === "none" && arrests === "on_collateral") setArrests("none");
    resetResult();
  };

  const handleSubmit = async () => {
    setError(null);
    if (amount < MIN_AMOUNT) {
      setError(`Укажите сумму кредита от ${formatRub(MIN_AMOUNT)}.`);
      return;
    }
    if (!isMortgage && collateral !== "none" && collateralValue <= 0) {
      setError("Укажите примерную стоимость залога.");
      return;
    }

    setLoading(true);
    try {
      const result = await requestCommissionEstimate({
        amount,
        mortgage: isMortgage,
        history,
        debtLoad,
        collateral,
        collateralValue: collateral !== "none" ? collateralValue : undefined,
        arrests,
        multipleBorrowers,
      });
      setEstimate(result);
      reachGoal(CALCULATOR_GOALS.ESTIMATE_SHOWN);
      // Прокручиваем к результату, чтобы на телефоне он не остался за экраном.
      requestAnimationFrame(() =>
        document.getElementById("calculator-result")?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось выполнить расчёт. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-8">
      <div className="grid gap-8 rounded-3xl border border-line bg-white p-6 md:p-10">
        <Fieldset legend="Сумма кредита">
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Например, 3 000 000"
              value={formatMoneyInput(amount)}
              onChange={(e) => {
                setAmountRaw(e.target.value);
                resetResult();
              }}
              className={cn(inputCls, "pr-12")}
              aria-label="Сумма кредита, рублей"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">₽</span>
          </div>
          <p className="mt-2 text-sm text-muted">Работаю с суммами от {formatRub(MIN_AMOUNT)}.</p>
        </Fieldset>

        <Fieldset legend="Для чего нужен кредит?">
          <Choices
            name="purpose"
            value={purpose}
            onChange={(v) => {
              setPurpose(v);
              resetResult();
            }}
            columns={2}
            options={[
              { value: "other", label: "Другое", hint: "Потребительский, бизнес-кредит, под залог, рефинансирование" },
              { value: "mortgage", label: "Ипотека" },
            ]}
          />
        </Fieldset>

        {!isMortgage && (
          <>
            <Fieldset legend="Кто вы?">
              <Choices
                name="clientKind"
                value={clientKind}
                onChange={(v) => {
                  setClientKind(v);
                  resetResult();
                }}
                columns={3}
                options={[
                  { value: "individual", label: "Физлицо" },
                  { value: "entrepreneur", label: "ИП" },
                  { value: "business", label: "ООО или другая компания" },
                ]}
              />
            </Fieldset>

            <Fieldset legend="Как вы оцениваете свою кредитную историю?">
              <Choices
                name="history"
                value={history}
                onChange={(v) => {
                  setHistory(v);
                  resetResult();
                }}
                options={HISTORY_OPTIONS}
              />
            </Fieldset>

            <Fieldset legend={debtLegend}>
              <Choices
                name="debtLoad"
                value={debtLoad}
                onChange={(v) => {
                  setDebtLoad(v);
                  resetResult();
                }}
                columns={3}
                options={DEBT_OPTIONS}
              />
            </Fieldset>

            <Fieldset legend="Есть ли залог?" hint="Недвижимость, автомобиль или другое ликвидное имущество.">
              <Choices name="collateral" value={collateral} onChange={handleCollateral} options={COLLATERAL_OPTIONS} />
              {collateral !== "none" && (
                <div className="mt-4">
                  <label htmlFor="collateral-value" className="mb-2 block text-sm font-medium text-ink">
                    Примерная стоимость залога
                  </label>
                  <div className="relative">
                    <input
                      id="collateral-value"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="Например, 8 000 000"
                      value={formatMoneyInput(collateralValue)}
                      onChange={(e) => {
                        setCollateralValueRaw(e.target.value);
                        resetResult();
                      }}
                      className={cn(inputCls, "pr-12")}
                    />
                    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted">₽</span>
                  </div>
                </div>
              )}
            </Fieldset>

            <Fieldset legend="Есть ли аресты или исполнительные производства?">
              <Choices
                name="arrests"
                value={arrests}
                onChange={(v) => {
                  setArrests(v);
                  resetResult();
                }}
                options={arrestOptions}
              />
            </Fieldset>

            <label className="flex cursor-pointer items-start gap-3 text-[0.95rem] leading-snug text-ink">
              <input
                type="checkbox"
                checked={multipleBorrowers}
                onChange={(e) => {
                  setMultipleBorrowers(e.target.checked);
                  resetResult();
                }}
                className="mt-1 h-4 w-4 shrink-0 accent-[#0d6150]"
              />
              Кредит оформляется на нескольких заёмщиков или на группу компаний
            </label>
          </>
        )}

        {error && (
          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}

        <div>
          <button type="button" onClick={handleSubmit} disabled={loading} className={cta("solid", "lg", "w-full sm:w-auto")}>
            {loading ? "Считаю…" : "Рассчитать комиссию"}
          </button>
        </div>
      </div>

      {estimate && (
        <div id="calculator-result" className="scroll-mt-24 rounded-3xl bg-mint p-6 md:p-10" role="status" aria-live="polite">
          {estimate.kind === "mortgage" ? (
            <>
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
                Комиссия по ипотеке обсуждается отдельно
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-ink">
                Условия по ипотеке зависят от ситуации, поэтому согласуем их индивидуально. Пройдите короткий опрос, и я
                свяжусь с вами.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-pine">Ориентировочная комиссия</p>
              <p className="mt-2 font-display text-5xl font-bold tracking-tight text-ink md:text-6xl">
                {estimate.percentLow === estimate.percentHigh
                  ? formatPercent(estimate.percentLow)
                  : `${formatPercent(estimate.percentLow).replace("%", "")}–${formatPercent(estimate.percentHigh)}`}
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-ink md:text-2xl">
                {estimate.rubLow === estimate.rubHigh
                  ? formatRub(estimate.rubLow)
                  : `${new Intl.NumberFormat("ru-RU").format(estimate.rubLow)} – ${formatRub(estimate.rubHigh)}`}
              </p>

              {estimate.complex && (
                <p className="mt-5 max-w-xl rounded-2xl bg-white/70 px-4 py-3 text-[0.95rem] leading-relaxed text-ink">
                  Ситуация непростая, поэтому точная цена определяется после анализа кредитных историй и документов.
                </p>
              )}

              {estimate.notes.length > 0 && (
                <ul className="mt-4 flex max-w-xl flex-col gap-2">
                  {estimate.notes.map((n) => (
                    <li key={n} className="flex gap-3 text-[0.95rem] leading-relaxed text-ink">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pine" />
                      {NOTE_TEXTS[n]}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted">
            Это ориентировочный расчёт по вашим ответам, он не является офертой и не гарантирует одобрение кредита.
            Окончательный размер комиссии фиксируется в договоре после анализа кредитных историй. Комиссия оплачивается
            только после того, как деньги поступили вам на счёт.
          </p>

          <SurveyLink
            className={cta("solid", "lg", "mt-6")}
            onNavigate={() => reachGoal(CALCULATOR_GOALS.TO_SURVEY)}
          >
            Пройти опрос
          </SurveyLink>
        </div>
      )}
    </div>
  );
}
