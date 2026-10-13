import { SectionHeading } from "@/components/ui/SectionHeading";

const SEGMENTS = [
  { title: "Физическим лицам", points: ["Банки отказывают без объяснения причин", "Одобряют сумму значительно меньше нужной", "Есть неофициальный доход, который сложно подтвердить"] },
  { title: "Индивидуальным предпринимателям", points: ["Нужны деньги на развитие дела", "Оборот по счёту есть, но банк оценивает его формально", "Нужно финансирование без залога личного имущества"] },
  { title: "Юридическим лицам (ООО)", points: ["Нужна кредитная линия или овердрафт", "Требуется факторинг или банковская гарантия", "Нужен партнёр, который подготовит заявку под требования банка"] },
  { title: "Тем, кто уже получал отказы", points: ["Пытались получить кредит самостоятельно", "Получили отказ в нескольких банках подряд", "Хотят понять реальные причины и перспективы"] },
];

export function Audience() {
  return (
    <section id="audience" className="section-y scroll-mt-16">
      <div className="container-page">
        <SectionHeading title="Кому я помогаю" />
        <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {SEGMENTS.map((s) => (
            <div key={s.title}>
              <h3 className="font-display text-lg font-bold leading-snug tracking-tight text-ink">{s.title}</h3>
              <ul className="mt-4 flex flex-col gap-3 border-l-2 border-pine pl-4">
                {s.points.map((p) => (
                  <li key={p} className="text-[0.95rem] leading-relaxed text-muted">
                    {p}
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
