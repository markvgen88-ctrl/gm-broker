import { HiOutlineInformationCircle } from "react-icons/hi";
import { KanikulyCalculator } from "@/components/sections/KanikulyCalculator";

/**
 * Блок «Посчитайте, что дадут каникулы именно вам» на странице «Кредитные каникулы»:
 * вводный текст; ниже на компьютере — пояснения слева и калькулятор справа, на телефоне — калькулятор, затем пояснения.
 * Подключается в pages/ServicePage.tsx под заголовком первого раздела.
 */
export function KanikulyCalculatorBlock({
  afterList,
  note,
}: {
  /** Абзацы раздела, которые идут после блока (текст «Поэтому сравнивать стоит два сценария…»). */
  afterList?: string[];
  /** Плашка «Каждая ситуация рассматривается индивидуально…». */
  note?: string;
}) {
  return (
    <section
      id="calculator"
      aria-labelledby="kanikuly-calc-title"
      className="mt-6 scroll-mt-24"
    >
      <h3
        id="kanikuly-calc-title"
        className="font-display text-xl font-bold tracking-tight text-ink"
      >
        Посчитайте, что дадут каникулы именно вам
      </h3>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink/85">
        Введите данные своего кредита и сумму, которую готовы вносить в месяц на
        каникулах (можно 0 ₽). Калькулятор сразу покажет результат.
      </p>
      <div className="mt-5 grid items-start gap-6 md:grid-cols-2 md:gap-12 lg:gap-16">
        <div className="order-1 md:order-2">
          <KanikulyCalculator />
        </div>
        <div className="order-2 md:order-1">
          <ul className="flex flex-col gap-3">
            <li className="flex gap-3 text-base leading-relaxed text-ink/85">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pine" />
              <span>
                <b className="font-semibold text-ink">
                  Ничего не вносите на каникулах
                </b>{" "}
                — долг не растёт, срок кредита увеличивается минимум на 18
                месяцев, а вы видите, сколько не отдаёте банку за это время.
              </span>
            </li>
            <li className="flex gap-3 text-base leading-relaxed text-ink/85">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pine" />
              <span>
                <b className="font-semibold text-ink">Вносите часть долга</b> —
                платежи уходят в погашение основного долга, как при уменьшении
                платежа, а не срока. Срок всё равно увеличивается минимум на 18
                месяцев, а платёж после каникул становится меньше. Точный график
                банк пересчитывает с учётом ваших платежей.
              </span>
            </li>
          </ul>
          {afterList?.map((p) => (
            <p key={p} className="mt-4 text-base leading-relaxed text-ink/85">
              {p}
            </p>
          ))}
          {note && (
            <div className="mt-6 flex gap-3 rounded-2xl bg-mint p-5 text-[0.95rem] leading-relaxed text-ink">
              <HiOutlineInformationCircle
                className="mt-0.5 shrink-0 text-pine"
                size={22}
              />
              {note}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
