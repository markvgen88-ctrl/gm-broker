import { HiOutlineCheckCircle } from "react-icons/hi";
import { cta } from "@/lib/cta";
import { useSectionNavigate } from "@/hooks/useSectionNavigate";

const FACTS = ["Без предоплаты", "Работа по договору", "Комиссия 15% только после поступления денег"];

export function Hero() {
  const goToSection = useSectionNavigate();

  return (
    <section id="top" className="pt-[4.25rem]">
      <div className="container-page pb-16 pt-12 md:pt-16 lg:pb-24 lg:pt-20">
        <div className="max-w-4xl">
          <h1 className="font-display text-[2rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink sm:text-5xl lg:text-[3.6rem]">
            Профессиональные <span className="text-pine">кредитно-правовые решения</span> для частных лиц и бизнеса
          </h1>
          <p className="measure mt-6 text-lg leading-relaxed text-muted">
            Помощь в одобрении кредитов для физлиц, ИП и ООО по всей России — от 100 000 ₽ до 1,5 млрд ₽.
            Финансирование для тех, кому «должны одобрять», но банки отказывают или дают меньшую сумму.
          </p>

          <ul className="mt-7 flex flex-col gap-2.5">
            {FACTS.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-base text-ink">
                <HiOutlineCheckCircle className="shrink-0 text-pine" size={22} />
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
