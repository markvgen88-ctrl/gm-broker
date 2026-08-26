import {
  HiOutlineUser,
  HiOutlineBriefcase,
  HiOutlineOfficeBuilding,
  HiOutlineTrendingUp,
} from "react-icons/hi";
import type { IconType } from "react-icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface Segment {
  icon: IconType;
  title: string;
  points: string[];
}

const SEGMENTS: Segment[] = [
  {
    icon: HiOutlineUser,
    title: "Физическим лицам",
    points: [
      "Банки отказывают без объяснения причин",
      "Одобряют сумму значительно меньше нужной",
      "Есть неофициальный доход, который сложно подтвердить",
    ],
  },
  {
    icon: HiOutlineBriefcase,
    title: "Индивидуальным предпринимателям",
    points: [
      "Нужны заёмные средства на развитие дела",
      "Оборот по счёту есть, но банк оценивает его формально",
      "Требуется финансирование без залога личного имущества",
    ],
  },
  {
    icon: HiOutlineOfficeBuilding,
    title: "Юридическим лицам (ООО)",
    points: [
      "Необходима кредитная линия или овердрафт",
      "Требуется факторинг или банковская гарантия",
      "Нужен партнёр, который подготовит заявку под требования банка",
    ],
  },
  {
    icon: HiOutlineTrendingUp,
    title: "Тем, кто уже получал отказы",
    points: [
      "Уже пытались получить кредит самостоятельно",
      "Получили отказ в нескольких банках подряд",
      "Хотят понять реальные причины и перспективы",
    ],
  },
];

export function Audience() {
  return (
    <section id="audience" className="relative py-24 md:py-32">
      <div className="container-page">
        <SectionHeading
          eyebrow="Для кого подходит"
          title="Работаю с теми, кому нужен результат, а не очередной отказ"
          className="mb-16"
        />

        <div className="grid gap-5 md:grid-cols-2">
          {SEGMENTS.map((segment, i) => (
            <Reveal key={segment.title} delay={(i % 2) * 0.1}>
              <div className="metal-border h-full rounded-2xl p-7 md:p-8">
                <div className="mb-5 flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
                    <segment.icon size={22} />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-silver md:text-xl">
                    {segment.title}
                  </h3>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {segment.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-metal">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
