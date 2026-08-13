import {
  HiOutlineCash,
  HiOutlineHome,
  HiOutlineRefresh,
  HiOutlineLibrary,
  HiOutlineTruck,
  HiOutlineBriefcase,
  HiOutlineOfficeBuilding,
  HiOutlineSwitchHorizontal,
  HiOutlineDocumentReport,
  HiOutlineDocumentDuplicate,
  HiOutlineChartSquareBar,
} from "react-icons/hi";
import type { IconType } from "react-icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface Service {
  icon: IconType;
  title: string;
}

const SERVICES: Service[] = [
  { icon: HiOutlineCash, title: "Потребительский кредит" },
  { icon: HiOutlineHome, title: "Ипотека" },
  { icon: HiOutlineRefresh, title: "Рефинансирование" },
  { icon: HiOutlineLibrary, title: "Кредит под залог недвижимости" },
  { icon: HiOutlineTruck, title: "Кредит под залог автомобиля" },
  { icon: HiOutlineBriefcase, title: "Финансирование ИП" },
  { icon: HiOutlineOfficeBuilding, title: "Финансирование ООО" },
  { icon: HiOutlineSwitchHorizontal, title: "Кредитные линии" },
  { icon: HiOutlineDocumentDuplicate, title: "Факторинг" },
  { icon: HiOutlineDocumentReport, title: "Банковская гарантия" },
  { icon: HiOutlineChartSquareBar, title: "Инвестиционные кредиты" },
];

export function Services() {
  return (
    <section id="services" className="relative overflow-hidden py-24 md:py-32">
      <div className="pointer-events-none absolute right-0 top-0 -z-10 h-[380px] w-[380px] rounded-full bg-gold-deep/10 blur-[130px]" />
      <div className="container-page">
        <SectionHeading
          eyebrow="Услуги"
          title="Полный спектр кредитных продуктов"
          description="Подбираю продукт под вашу задачу — от потребительского кредита до банковской гарантии для бизнеса."
          className="mb-16"
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <Reveal key={service.title} delay={(i % 3) * 0.06}>
              <div className="group flex items-center gap-4 rounded-2xl border border-white/6 bg-graphite/30 p-6 transition-all duration-400 hover:-translate-y-1 hover:border-gold/30 hover:bg-graphite/60">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl metal-border text-gold transition-colors duration-300">
                  <service.icon size={21} />
                </div>
                <h3 className="font-display text-[0.98rem] font-semibold leading-snug text-silver">
                  {service.title}
                </h3>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
