import { Link } from "react-router-dom";
import { HiArrowRight } from "react-icons/hi";
import { SectionHeading } from "@/components/ui/SectionHeading";

const LINKS = [
  { to: "/articles/bankrotstvo-fizicheskogo-litsa-kak-spisat-dolgi", label: "Банкротство через суд" },
  { to: "/articles/vnesudebnoe-bankrotstvo-cherez-mfts", label: "Внесудебное банкротство" },
  { to: "/articles/restrukturizatsiya-sudebnogo-dolga", label: "Реструктуризация долга" },
  { to: "/articles/ispravlenie-kreditnoy-istorii-oshibki", label: "Исправление кредитной истории" },
  { to: "/articles/vykup-dolga-cherez-tretye-litso", label: "Выкуп долга через третье лицо" },
];

export function DebtHelp() {
  return (
    <section id="debts" className="section-y scroll-mt-16 bg-white">
      <div className="container-page grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <SectionHeading
          eyebrow="Юридическая помощь"
          title="Есть долги, суд или приставы?"
          description="Если в кредитной истории зависшие долги, которых давно нет, или непосильная нагрузка: платежи, после которых не остаётся средств на жизнь, кредит может быть не лучшим путём. Предлагаю следующие варианты решения."
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
