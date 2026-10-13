import { cta } from "@/lib/cta";
import { useSectionNavigate } from "@/hooks/useSectionNavigate";

const FACTS = ["Без предоплаты", "Работа по договору", "Комиссия 15% только после поступления денег"];

export function Hero() {
  const goToSection = useSectionNavigate();

  return (
    <section id="top" className="pt-[4.25rem]">
      <div className="container-page pb-16 pt-12 md:pt-16 lg:pb-24 lg:pt-20">
        <div className="max-w-4xl">
          <span aria-hidden className="mb-8 block h-px w-14 bg-champagne" />
          <h1 className="text-[2.15rem] leading-[1.12] text-ink sm:text-5xl lg:text-[3.7rem]">
            Профессиональные <span className="italic text-pine">кредитно-правовые решения</span> для частных лиц и бизнеса
          </h1>
          <p className="measure mt-6 text-lg leading-relaxed text-muted">
            Помощь в одобрении кредитов для физлиц, ИП и ООО по всей России — от 100 000 ₽ до 1,5 млрд ₽.
            Финансирование для тех, кому «должны одобрять», но банки отказывают или дают меньшую сумму.
          </p>

          <ul className="mt-10 grid max-w-3xl divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {FACTS.map((f) => (
              <li key={f} className="flex items-start gap-3 py-4 text-[0.95rem] leading-snug text-ink sm:px-5 sm:first:pl-0">
                <span aria-hidden className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rotate-45 bg-champagne" />
                {f}
              </li>
            ))}
          </ul>

          <p className="mt-8 max-w-md text-sm leading-relaxed text-muted">
            Клиентам с просрочкой доступно только залоговое кредитование от 21% годовых. Если получить кредит
            невозможно, скажу об этом сразу и дам бесплатную рекомендацию.
          </p>

          {/* Только на мобильном: на компьютере кнопка «Юридическая помощь» есть в шапке */}
          <div className="mt-6 lg:hidden">
            <p className="max-w-md text-base leading-relaxed text-ink">
              Для сложных случаев предусмотрены профессиональные юридические услуги.
            </p>
            <button
              type="button"
              onClick={() => goToSection("debts")}
              className={cta("outline", "lg", "mt-4 w-full sm:w-auto")}
            >
              Юридическая помощь
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
