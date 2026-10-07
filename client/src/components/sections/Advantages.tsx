import { SectionHeading } from "@/components/ui/SectionHeading";

const TERMS = [
  { title: "Без предоплаты", text: "Работа начинается без авансовых платежей с вашей стороны." },
  { title: "Комиссия 15%", text: "Оплачивается только после того, как деньги поступили вам на счёт." },
  { title: "Договор с первого дня", text: "Обязательства сторон, размер комиссии и порядок оплаты закреплены письменно." },
  { title: "Весь процесс онлайн", text: "Работаю по всей России, кроме Крыма и Северного Кавказа. Приезжать никуда не нужно." },
];

const APPROACH = [
  "Разбираю именно вашу ситуацию, без шаблонов и массовых заявок во все банки.",
  "Определяю банк и продукт, где шансы на одобрение максимальны.",
  "Объясняю причины отказов простым языком.",
  "Сопровождаю от подачи заявки до получения средств.",
];

export function Advantages() {
  return (
    <section id="advantages" className="section-y scroll-mt-16">
      <div className="container-page">
        <SectionHeading title="Условия работы понятны заранее" />

        <dl className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
          {TERMS.map((t) => (
            <div key={t.title} className="border-t-2 border-ink pt-4">
              <dt className="font-display text-xl font-bold tracking-tight text-ink">{t.title}</dt>
              <dd className="mt-2 text-[0.95rem] leading-relaxed text-muted">{t.text}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-16 grid gap-8 rounded-3xl bg-mint p-7 md:grid-cols-[0.8fr_1.2fr] md:p-10">
          <h3 className="font-display text-2xl font-bold leading-tight tracking-tight text-ink">
            Работаю на результат, а не на количество заявок
          </h3>
          <ul className="flex flex-col gap-3">
            {APPROACH.map((a) => (
              <li key={a} className="flex gap-3 text-base leading-relaxed text-ink">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pine" />
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
