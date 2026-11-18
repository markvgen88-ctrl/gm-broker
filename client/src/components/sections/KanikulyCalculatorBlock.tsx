import { HiArrowRight } from "react-icons/hi";
import { KanikulyCalculator } from "@/components/sections/KanikulyCalculator";

/**
 * Блок «Посчитайте, что дадут каникулы именно вам» на странице «Кредитные каникулы»:
 * вводный текст, калькулятор (на компьютере поля слева, результат справа), затем пояснения.
 * Подключается в pages/ServicePage.tsx под заголовком первого раздела.
 */
export function KanikulyCalculatorBlock() {
  return (
    <section
      id="calculator"
      aria-labelledby="kanikuly-calc-title"
      className="mt-6 scroll-mt-24"
    >
      <h3
        id="kanikuly-calc-title"
        className="font-display text-lg font-bold tracking-tight text-ink"
      >
        Посчитайте, что дадут каникулы именно вам
      </h3>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/85">
        Введите данные своего кредита и сумму, которую готовы вносить в месяц на
        каникулах (можно 0 ₽). Калькулятор сразу покажет результат.
      </p>
      <div className="mt-5">
        <KanikulyCalculator />
      </div>
      <div className="mt-6">
        <ul className="mt-4 flex flex-col gap-3">
          <li className="flex gap-3 text-[0.95rem] leading-relaxed text-ink/85">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pine" />
            <span>
              <b className="font-semibold text-ink">
                Ничего не вносите на каникулах
              </b>{" "}
              — долг не растёт, срок кредита увеличивается минимум на 18
              месяцев, а вы видите, сколько не отдаёте банку за это время.
            </span>
          </li>
          <li className="flex gap-3 text-[0.95rem] leading-relaxed text-ink/85">
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
        <h4 className="mt-5 text-[0.95rem] font-semibold text-ink">
          Как считаются проценты на каникулах
        </h4>
        <p className="mt-2 text-sm leading-relaxed text-ink/85">
          <b className="font-semibold text-ink">Кроме ипотеки:</b> проценты
          начисляются по ставке 2/3 от среднерыночной ПСК, но не выше ставки по
          договору. После каникул государство компенсирует банку 50% этих
          процентов, остальные 50% банк списывает — вам платить ничего не нужно.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink/85">
          <b className="font-semibold text-ink">Ипотека:</b> проценты считаются
          по прежней ставке, но так, чтобы общий долг за время каникул не
          увеличивался. Пропущенные платежи, включая проценты, переносятся на
          конец первоначального графика.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Расчёт ориентировочный: равные платежи, без страховок и комиссий.
          Точные цифры зависят от вашего договора и количества кредитов.
        </p>
        <a
          href="#request"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-white hover:bg-pine-deep"
        >
          Узнать, подойдут ли мне каникулы <HiArrowRight />
        </a>
      </div>
    </section>
  );
}
