import { HiArrowRight } from "react-icons/hi";
import { ServiceLink } from "@/components/ui/ServiceLink";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GROUP_TITLES, servicesByGroup, type ServiceGroup } from "@/data/services";

const GROUPS: ServiceGroup[] = ["person", "business", "extra"];

export function Services() {
  return (
    <section id="services" className="section-y scroll-mt-16 bg-white/65">
      <div className="container-page">
        <SectionHeading
          title="Виды кредитования"
          description="Нажмите на нужный вид: расскажу, кому он подходит, что я делаю и какие документы понадобятся, а потом приглашу пройти короткий опрос."
        />

        <div className="mt-14 flex flex-col gap-16">
          {GROUPS.map((g) => (
            <div key={g}>
              <h3 className="mb-6 border-b border-line pb-3 text-2xl text-ink">{GROUP_TITLES[g]}</h3>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {servicesByGroup(g).map((s) => (
                  <li key={s.slug}>
                    <ServiceLink
                      service={s}
                      className="group flex h-full w-full flex-col rounded-xl text-left border border-line bg-paper/80 p-7 transition-colors duration-300 hover:border-champagne hover:bg-white"
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-pine ring-1 ring-line group-hover:ring-pine/30">
                        <s.icon size={22} />
                      </span>
                      <span className="mt-5 font-serif text-xl font-semibold leading-snug text-ink">{s.title}</span>
                      <span className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-muted">{s.short}</span>
                      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-pine">
                        {s.comingSoon ? "Скоро" : "Подробнее"}{" "}
                        <HiArrowRight className="transition-transform group-hover:translate-x-1" />
                      </span>
                    </ServiceLink>
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
