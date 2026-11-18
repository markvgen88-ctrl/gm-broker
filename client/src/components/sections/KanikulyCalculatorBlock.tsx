import { HiArrowRight } from "react-icons/hi";
import { KanikulyCalculator } from "@/components/sections/KanikulyCalculator";

/**
 * Блок «Посчитайте свою выгоду» на странице «Кредитные каникулы»:
 * описание слева, калькулятор справа (на телефоне — друг под другом).
 * Подключается в pages/ServicePage.tsx вместо прежнего графика.
 */
export function KanikulyCalculatorBlock() {
  return (
    <section
      id="calculator"
      aria-labelledby="kanikuly-calc-title"
      className="mt-6 scroll-mt-24 rounded-2xl bg-mint p-5 md:p-6"
    >
      <div className="grid items-start gap-6 md:grid-cols-[1fr_auto] md:gap-8">
        <div>
          <h3 id="kanikuly-calc-title" className="font-display text-lg font-bold tracking-tight text-ink">
            Посчитайте, что дадут каникулы именно вам
          </h3>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/85">
            Введите данные своего кредита и сумму, которую готовы вносить в месяц на каникулах (можно 0 ₽).
            Калькулятор сразу покажет результат.
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            <li className="flex gap-3 text-[0.95rem] leading-relaxed text-ink/85">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pine" />
              <span>
                <b className="font-semibold text-ink">Ничего не вносите на каникулах</b> — проценты не начисляются,
                срок кредита сдвигается на 18 месяцев, а вы видите, сколько не отдаёте банку за это время.
              </span>
            </li>
            <li className="flex gap-3 text-[0.95rem] leading-relaxed text-ink/85">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pine" />
              <span>
                <b className="font-semibold text-ink">Вносите часть долга</b> — кредит закрывается в прежнюю дату,
                платёж после каникул пересчитывается, а вы видите экономию на процентах.
              </span>
            </li>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Расчёт ориентировочный: равные платежи, без страховок и комиссий. Точные цифры зависят от вашего договора
            и количества кредитов.
          </p>
          <a
            href="#request"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-pine px-5 py-2.5 text-sm font-semibold text-white hover:bg-pine-deep"
          >
            Узнать, подойдут ли мне каникулы <HiArrowRight />
          </a>
        </div>
        <div className="justify-self-center md:justify-self-end">
          <KanikulyCalculator />
        </div>
      </div>
    </section>
  );
}
