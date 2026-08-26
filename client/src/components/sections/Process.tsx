import {
  HiOutlineSearch,
  HiOutlineClipboardCheck,
  HiOutlineLightBulb,
  HiOutlineOfficeBuilding,
  HiOutlineCash,
} from "react-icons/hi";
import type { IconType } from "react-icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface Step {
  icon: IconType;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: HiOutlineSearch,
    title: "Анализ ситуации",
    description: "Изучаю доходы, кредитную историю и цель финансирования, оцениваю реальные шансы.",
  },
  {
    icon: HiOutlineClipboardCheck,
    title: "Проверка документов",
    description: "Проверяю полноту и корректность документов, устраняю слабые места заранее.",
  },
  {
    icon: HiOutlineLightBulb,
    title: "Подбор решения",
    description: "Определяю банк и продукт, которые дадут максимальный шанс на одобрение.",
  },
  {
    icon: HiOutlineOfficeBuilding,
    title: "Работа с банками",
    description: "Готовлю и сопровождаю заявку, представляю сильные стороны клиента банку.",
  },
  {
    icon: HiOutlineCash,
    title: "Получение финансирования",
    description: "Довожу сделку до перечисления средств на максимально выгодных условиях.",
  },
];

export function Process() {
  return (
    <section id="process" className="relative py-24 md:py-32">
      <div className="container-page">
        <SectionHeading
          eyebrow="Как проходит работа"
          title="Пять шагов от заявки до денег на счёте"
          className="mb-20"
        />

        <div className="relative">
          {/* connecting line */}
          <div className="absolute left-6 top-2 bottom-2 w-px bg-gradient-to-b from-gold/60 via-gold/25 to-transparent md:left-1/2 md:-translate-x-1/2" />

          <ol className="flex flex-col gap-10 md:gap-14">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative">
                <div
                  className={`flex flex-col gap-6 md:flex-row md:items-center ${
                    i % 2 === 1 ? "md:flex-row-reverse" : ""
                  }`}
                >
                  <Reveal
                    className="relative flex flex-1 items-start gap-5 pl-16 md:pl-0"
                    delay={0.05}
                  >
                    <div
                      className={`hidden md:block md:flex-1 ${i % 2 === 1 ? "md:text-left" : "md:text-right"}`}
                    >
                      <span className="eyebrow">{`0${i + 1}`}</span>
                      <h3 className="mt-2 font-display text-xl font-semibold text-silver md:text-2xl">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-metal md:text-base">
                        {step.description}
                      </p>
                    </div>

                    <div className="absolute left-0 top-0 grid h-12 w-12 shrink-0 place-items-center rounded-full metal-border bg-graphite text-gold shadow-gold md:static md:order-none">
                      <step.icon size={22} />
                    </div>

                    <div className="md:hidden">
                      <span className="eyebrow">{`0${i + 1}`}</span>
                      <h3 className="mt-2 font-display text-lg font-semibold text-silver">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-metal">{step.description}</p>
                    </div>
                  </Reveal>

                  <div className="hidden flex-1 md:block" />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
