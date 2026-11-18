import { useEffect, useMemo, useState } from "react";
import "./KanikulyCalculator.css";

/**
 * Калькулятор выгоды кредитных каникул (18 мес.) — на странице услуги
 * «Кредитные каникулы» (pages/ServicePage.tsx).
 * Ширина виджета — переменная --kc-width в KanikulyCalculator.css.
 *
 * Правила расчёта (для клиента):
 *  - проценты за период каникул клиент не платит (кроме ипотеки долг за каникулы
 *    не растёт, пропущенные платежи переносятся в конец графика) — остаток долга
 *    на каникулах не увеличивается;
 *  - срок кредита увеличивается минимум на 18 мес. в любом случае;
 *  - платежи клиента на каникулах идут в погашение основного долга (как «уменьшение
 *    платежа», а не срока): платёж после каникул пересчитывается на оставшийся срок;
 *  - платёж на каникулах не больше обычного ежемесячного платежа.
 * Расчёт ориентировочный: аннуитет, без страховок и комиссий.
 */
const N = 18;
const nf = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const spaced = (v: number) =>
  nf.format(Math.round(v)).replace(/[\u00a0\u202f]/g, " ");
const money = (v: number) =>
  nf.format(Math.round(v)).replace(/\u202f/g, "\u00a0") + "\u00a0₽";
const num = (s: string) => {
  const t = s.replace(/\s/g, "").replace(",", ".");
  return t === "" ? NaN : Number(t);
};

type Vals = {
  loan: string;
  term: string;
  rate: string;
  pay: string;
  paid: string;
  own: string;
};
type Calc =
  | { kind: "invalid"; bad: Record<keyof Vals, boolean> }
  | { kind: "short"; bad: Record<keyof Vals, boolean> }
  | {
      kind: "ok";
      bad: Record<keyof Vals, boolean>;
      P: number;
      X: number;
      shift: boolean;
      now: number;
      bh: number;
      bi: number;
      ai: number;
      freed: number;
      saved: number;
      Pn: number;
    };

function calculate(v: Vals): Calc {
  const L = num(v.loan);
  const T = num(v.term);
  const r = num(v.rate);
  let k = num(v.paid);
  let X = num(v.own);
  const Pin = num(v.pay);
  const noPay = v.pay.trim() === "";
  if (isNaN(k) && v.paid.trim() === "") k = 0;
  if (isNaN(X) && v.own.trim() === "") X = 0;

  const bad = {
    loan: !(L > 0),
    term: !(T >= 1 && T <= 480 && T === Math.floor(T)),
    rate: !(r >= 0 && r <= 100),
    pay: !(noPay || Pin > 0),
    paid: !(k >= 0 && k === Math.floor(k) && (isNaN(T) || k < T)),
    own: !(X >= 0),
  };
  const ok = !Object.values(bad).some(Boolean);
  if (!ok) return { kind: "invalid", bad };
  if (T - k <= N) return { kind: "short", bad };

  const i = r / 1200;
  const P = !noPay
    ? Pin
    : i === 0
      ? L / T
      : (L * i) / (1 - Math.pow(1 + i, -T));
  if (X > P) X = Math.round(P);

  let bal = L;
  for (let q = 0; q < k; q++) bal = Math.max(0, bal + bal * i - P);
  const R = T - k;
  const now = bal;
  let bi = 0;
  let paid = 0;
  let b2 = bal;
  for (let t = 1; t <= R; t++) {
    if (b2 > 0.005) {
      const it = b2 * i;
      bi += it;
      const py = Math.min(P, b2 + it);
      if (t <= N) paid += py;
      b2 = Math.max(0, b2 + it - py);
    }
  }
  let bh = now;
  let paidH = 0;
  for (let j = 0; j < N; j++) {
    const p = Math.min(X, bh);
    paidH += p;
    bh -= p;
  }
  bh = Math.max(0, bh);
  const shift = !(X > 0);
  const Pn = shift
    ? P
    : bh > 0.005
      ? i === 0
        ? bh / R
        : (bh * i) / (1 - Math.pow(1 + i, -R))
      : 0;
  // Срок после каникул не сокращается: платёж пересчитывается на оставшиеся R месяцев.
  const ai = shift ? bi : Math.max(0, Pn * R - bh);
  const freed = Math.max(0, paid - paidH);
  const saved = shift ? 0 : Math.max(0, bi - ai);
  return { kind: "ok", bad, P, X, shift, now, bh, bi, ai, freed, saved, Pn };
}

function Field({
  id,
  label,
  unit,
  value,
  bad,
  mode,
  placeholder,
  onChange,
  wide,
}: {
  id: keyof Vals;
  label: string;
  unit: string;
  value: string;
  bad: boolean;
  mode: "decimal" | "numeric";
  placeholder?: string;
  onChange: (v: string) => void;
  wide?: boolean;
}) {
  return (
    <div className={`field${wide ? " wide" : ""}`}>
      <label htmlFor={`kc-${id}`}>{label}</label>
      <div className={`inp${bad ? " bad" : ""}`}>
        <input
          id={`kc-${id}`}
          inputMode={mode}
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
        />
        <span>{unit}</span>
      </div>
    </div>
  );
}

export function KanikulyCalculator() {
  const [v, setV] = useState<Vals>({
    loan: "3 900 000",
    term: "60",
    rate: "35",
    pay: "138 400",
    paid: "6",
    own: "10 000",
  });
  const set = (k: keyof Vals) => (val: string) =>
    setV((p) => ({ ...p, [k]: val }));
  const c = useMemo(() => calculate(v), [v]);

  // Платёж на каникулах не может быть больше ежемесячного платежа — подрезаем само поле.
  useEffect(() => {
    if (c.kind === "ok" && num(v.own) > c.X)
      setV((p) => ({ ...p, own: spaced(c.X) }));
  }, [c, v.own]);

  const sliderMax = c.kind === "ok" ? Math.round(c.P) : 0;
  const ownNum = num(v.own);
  const sliderVal =
    c.kind === "ok" ? Math.min(isNaN(ownNum) ? 0 : ownNum, sliderMax) : 0;

  let out;
  if (c.kind === "short") {
    out = (
      <div className="empty">
        Каникулы возможны, если до конца кредита больше 18 месяцев
      </div>
    );
  } else if (c.kind === "invalid") {
    out = <div className="empty">Заполните поля — расчёт появится здесь</div>;
  } else {
    const key = money(c.shift ? c.freed : c.saved);
    out = (
      <>
        <div className="hero">
          <small>
            {c.shift ? "Не платите банку 18 мес." : "Экономия на процентах"}
          </small>
          <div key={key} className="big pulse">
            {key}
          </div>
        </div>
        <div className="stats">
          <div className="stat acc">
            <small>Платёж после каникул</small>
            <b>{money(c.shift ? c.P : c.Pn)}</b>
          </div>
          <div className="stat">
            <small>Срок кредита</small>
            <b>от +18 мес.</b>
          </div>
          {!c.shift && (
            <div className="stat wide">
              <small>Не платите банку за 18 мес.</small>
              <b>{money(c.freed)}</b>
            </div>
          )}
          <div className="stat wide">
            <small>Долг сейчас → после каникул</small>
            <b>
              {money(c.now)} → {money(c.bh)}
            </b>
          </div>
          <div className="stat wide">
            <small>Проценты без → с каникулами</small>
            <b>
              {money(c.bi)} → {money(c.ai)}
            </b>
          </div>
        </div>
        <p className="fine">
          Ориентировочный расчёт: равные платежи, без страховок и комиссий.
          Точные цифры зависят от договора.
        </p>
      </>
    );
  }

  return (
    <div className="kcalc">
      <section aria-label="Данные по кредиту">
        <div className="fields">
          <Field
            id="loan"
            label="Сумма кредита"
            unit="₽"
            mode="decimal"
            value={v.loan}
            bad={c.bad.loan}
            onChange={set("loan")}
          />
          <Field
            id="term"
            label="Срок"
            unit="мес."
            mode="numeric"
            value={v.term}
            bad={c.bad.term}
            onChange={set("term")}
          />
          <Field
            id="rate"
            label="Ставка"
            unit="% год."
            mode="decimal"
            value={v.rate}
            bad={c.bad.rate}
            onChange={set("rate")}
          />
          <Field
            id="pay"
            label="Платёж в месяц"
            unit="₽"
            mode="decimal"
            value={v.pay}
            bad={c.bad.pay}
            placeholder="посчитаем сами"
            onChange={set("pay")}
          />
          <Field
            id="paid"
            label="Уже оплачено"
            unit="мес."
            mode="numeric"
            value={v.paid}
            bad={c.bad.paid}
            onChange={set("paid")}
          />
          <Field
            id="own"
            label="На каникулах в мес."
            unit="₽"
            mode="decimal"
            value={v.own}
            bad={c.bad.own}
            onChange={set("own")}
          />
          <div className="field wide">
            <input
              type="range"
              min={0}
              max={sliderMax}
              step="any"
              value={sliderVal}
              disabled={c.kind !== "ok"}
              aria-label="Платёж на каникулах"
              onChange={(e) => set("own")(spaced(Number(e.target.value)))}
            />
          </div>
        </div>
      </section>
      <section className="out" aria-live="polite">
        {out}
      </section>
    </div>
  );
}
