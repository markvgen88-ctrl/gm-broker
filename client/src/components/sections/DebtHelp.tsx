import { Link } from "react-router-dom";
import { HiArrowRight } from "react-icons/hi";
import { SectionHeading } from "@/components/ui/SectionHeading";

const LINKS = [
  { to: "/articles/bankrotstvo-fizicheskogo-litsa-kak-spisat-dolgi", label: "О банкротстве через суд" },
  { to: "/articles/vnesudebnoe-bankrotstvo-cherez-mfts", label: "О внесудебном банкротстве" },
  { to: "/articles/restrukturizatsiya-sudebnogo-dolga", label: "О реструктуризации долга" },
  { to: "/articles/ispravlenie-kreditnoy-istorii-oshibki", label: "О том, как исправить кредитную историю" },
  { to: "/articles/vykup-dolga-cherez-tretye-litso", label: "О выкупе долга через третье лицо" },
];

export function DebtHelp() {
  return (
    <section id="debts" className="section-y scroll-mt-16">
      <div className="container-page grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <SectionHeading
          title="Есть долги, суд или приставы?"
          description="Если в кредитной истории зависшие долги или непосильная нагрузка, кредит может быть не лучшим первым шагом. Рассказываю о вариантах решения в статьях."
        />
        <ul className="flex flex-col divide-y divide-line border-y border-line">
          {LINKS.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className="group flex items-center justify-between gap-4 py-4 text-base font-medium text-ink transition-colors hover:text-pine"
              >
                {l.label}
                <HiArrowRight className="shrink-0 transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
