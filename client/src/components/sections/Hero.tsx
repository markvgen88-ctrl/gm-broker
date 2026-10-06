import { HiArrowRight, HiOutlineCheckCircle } from "react-icons/hi";
import { cta } from "@/lib/cta";
import { ServiceLink } from "@/components/ui/ServiceLink";
import { SurveyLink } from "@/components/ui/SurveyLink";
import { GROUP_TITLES, servicesByGroup, type ServiceGroup } from "@/data/services";

const FACTS = ["Без предоплаты", "Работа по договору", "Комиссия 15% только после поступления денег"];
const GROUPS: ServiceGroup[] = ["person", "business", "extra"];

export function Hero() {
  return (
    <section id="top" className="pt-[4.25rem]">
      <div className="container-page grid gap-12 pb-16 pt-12 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-16 lg:pb-24 lg:pt-20">
        <div>
          <h1 className="font-display text-[2.35rem] font-extrabold leading-[1.04] tracking-[-0.035em] text-ink sm:text-5xl lg:text-[3.6rem]">
            Кредит, когда банки отказывают или одобряют мало
          </h1>
          <p className="measure mt-6 text-lg leading-relaxed text-muted">
            Подбираю банк, готовлю заявку и довожу сделку до денег на счёте. Для физлиц, ИП и ООО по всей России, от
            100 000 ₽ до 1,5 млрд ₽.
          </p>

          <ul className="mt-7 flex flex-col gap-2.5">
            {FACTS.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-base text-ink">
                <HiOutlineCheckCircle className="shrink-0 text-pine" size={22} />
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <SurveyLink className={cta("solid", "lg")}>
              Пройти опрос за 2 минуты <HiArrowRight />
            </SurveyLink>
            <a href="#services" className="text-base font-semibold text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
              Выбрать вид кредита
            </a>
          </div>

          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">
            Клиентам с просрочкой доступно только залоговое кредитование от 21% годовых. Если получить кредит
            невозможно, скажу об этом сразу и дам бесплатную рекомендацию.
          </p>
        </div>

        {/* Выбор вида кредитования: главный элемент страницы */}
        <div className="rounded-3xl bg-ink p-6 text-white shadow-[0_30px_70px_-30px_rgba(15,30,25,0.6)] md:p-8">
          <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">Что вам нужно?</h2>
          <p className="mt-1.5 text-sm text-white/60">Выберите вид кредитования — покажу, как это работает.</p>

          <div className="mt-6 flex flex-col gap-6">
            {GROUPS.map((g) => (
              <div key={g}>
                <p className="mb-2.5 text-sm font-semibold text-pine-bright">{GROUP_TITLES[g]}</p>
                <ul className="flex flex-wrap gap-2">
                  {servicesByGroup(g).map((s) => (
                    <li key={s.slug}>
                      <ServiceLink
                        service={s}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-pine-bright hover:bg-pine-bright hover:text-ink"
                      >
                        {s.title}
                        {s.comingSoon && <span className="text-xs opacity-70">скоро</span>}
                      </ServiceLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-7 border-t border-white/10 pt-5 text-sm text-white/65">
            Не знаете, что выбрать?{" "}
            <SurveyLink className="font-semibold text-white underline underline-offset-4 hover:text-pine-bright">
              Пройдите опрос
            </SurveyLink>
            , и я подскажу.
          </div>
        </div>
      </div>
    </section>
  );
}
