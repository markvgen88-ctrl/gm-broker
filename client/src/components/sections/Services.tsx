import { ServiceCard } from "@/components/ui/ServiceCard";
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

        <div className="mt-12 flex flex-col gap-14">
          {GROUPS.map((g) => (
            <div key={g}>
              <h3 className="mb-5 font-display text-xl font-bold tracking-tight text-ink">{GROUP_TITLES[g]}</h3>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {servicesByGroup(g).map((s) => (
                  <li key={s.slug}>
                    <ServiceCard service={s} />
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
