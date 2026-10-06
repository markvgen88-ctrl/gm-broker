import { Link } from "react-router-dom";
import { HiArrowRight } from "react-icons/hi";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GROUP_TITLES, servicesByGroup, type ServiceGroup } from "@/data/services";

const GROUPS: ServiceGroup[] = ["person", "business"];

export function Services() {
  return (
    <section id="services" className="section-y scroll-mt-16 bg-white">
      <div className="container-page">
        <SectionHeading
          title="Виды кредитования"
          description="Нажмите на нужный вид: расскажу, кому он подходит, что я делаю и какие документы понадобятся, а потом приглашу пройти короткий опрос."
        />

        <div className="mt-12 flex flex-col gap-14">
          {GROUPS.map((g) => (
            <div key={g}>
              <h3 className="mb-5 font-display text-xl font-bold tracking-tight text-ink">{GROUP_TITLES[g]}</h3>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {servicesByGroup(g).map((s) => (
                  <li key={s.slug}>
                    <Link
                      to={`/services/${s.slug}`}
                      className="group flex h-full flex-col rounded-2xl border border-line bg-paper p-6 transition-colors hover:border-pine hover:bg-mint"
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-pine ring-1 ring-line group-hover:ring-pine/30">
                        <s.icon size={22} />
                      </span>
                      <span className="mt-5 font-display text-lg font-semibold leading-snug text-ink">{s.title}</span>
                      <span className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-muted">{s.short}</span>
                      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-pine">
                        Подробнее <HiArrowRight className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
