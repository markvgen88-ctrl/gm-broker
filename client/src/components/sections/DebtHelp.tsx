import { ServiceCard } from "@/components/ui/ServiceCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { servicesByGroup } from "@/data/services";

export function DebtHelp() {
  return (
    <section id="debts" className="section-y scroll-mt-16 bg-white/65">
      <div className="container-page">
        <SectionHeading
          eyebrow="Юридическая помощь"
          title="Есть долги, суд или приставы?"
          description="Если в кредитной истории зависшие долги, которых давно нет, или непосильная нагрузка: платежи, после которых не остаётся средств на жизнь, кредит может быть не лучшим путём. Выберите вариант — расскажу подробнее и приму вашу заявку именно на эту услугу."
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {servicesByGroup("legal").map((s) => (
            <li key={s.slug}>
              <ServiceCard service={s} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
