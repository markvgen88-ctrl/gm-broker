import { SectionHeading } from "@/components/ui/SectionHeading";

const STEPS = [
  { title: "Опрос", text: "Вы отвечаете на несколько вопросов о себе и цели кредита. Это занимает около 2 минут." },
  { title: "Звонок в течение суток", text: "Связываюсь с вами в течение 24 часов, объясняю, как проходит работа." },
  { title: "Анализ и ответ", text: "Изучаю доходы и кредитную историю, оцениваю реальные шансы. Если помочь не смогу, скажу честно и дам рекомендации." },
  { title: "Договор и подбор банка", text: "При положительном решении заключаем договор. Определяю банк и продукт с максимальным шансом одобрения." },
  { title: "Заявка и деньги", text: "Готовлю и сопровождаю заявку, довожу сделку до перечисления средств." },
];

export function Process() {
  return (
    <section id="process" className="section-y scroll-mt-16">
      <div className="container-page">
        <SectionHeading
          title="Как проходит работа: пять шагов от заявки до денег"
          description="Работа по подбору кредита начинается только после подписания договора."
        />
        <ol className="mt-14 grid gap-x-8 gap-y-10 md:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t border-champagne/60 pt-5">
              <span className="font-serif text-4xl font-medium leading-none text-champagne">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-lg leading-snug text-ink">{s.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
