import {
  HiOutlineDocumentText,
  HiOutlineCreditCard,
  HiOutlineGlobeAlt,
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineBadgeCheck,
} from "react-icons/hi";
import type { IconType } from "react-icons";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface Advantage {
  icon: IconType;
  title: string;
  description: string;
}

const ADVANTAGES: Advantage[] = [
  {
    icon: HiOutlineCreditCard,
    title: "Без предоплаты",
    description: "Работа начинается без каких-либо авансовых платежей с вашей стороны.",
  },
  {
    icon: HiOutlineDocumentText,
    title: "Работа по договору",
    description: "Все обязательства сторон юридически закреплены с первого дня сотрудничества.",
  },
  {
    icon: HiOutlineChartBar,
    title: "Индивидуальный анализ",
    description: "Детально разбираю именно вашу ситуацию — без шаблонов и массовых заявок.",
  },
  {
    icon: HiOutlineBadgeCheck,
    title: "Подбор банка",
    description: "Определяю банк и продукт, где ваши шансы на одобрение максимальны.",
  },
  {
    icon: HiOutlineUserGroup,
    title: "Сопровождение",
    description: "Провожу клиента через все этапы сделки — от подачи до получения средств.",
  },
  {
    icon: HiOutlineGlobeAlt,
    title: "Удалённая работа",
    description: "Работаю онлайн по всей России — личное присутствие не требуется.",
  },
  {
    icon: HiOutlineShieldCheck,
    title: "Оплата только после результата",
    description: "Комиссия удерживается лишь после фактического поступления средств клиенту.",
  },
];

export function Advantages() {
  return (
    <section id="advantages" className="relative py-24 md:py-32">
      <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-gold/5 blur-[160px]" />
      <div className="container-page">
        <SectionHeading
          eyebrow="Преимущества"
          title="Работа, построенная на доверии и результате"
          className="mb-16"
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ADVANTAGES.map((item, i) => (
            <Reveal key={item.title} delay={(i % 3) * 0.08}>
              <div className="group relative h-full overflow-hidden rounded-2xl glass-panel p-7 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-soft">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-gold/0 via-gold/0 to-gold/0 transition-all duration-500 group-hover:from-gold/[0.06] group-hover:to-transparent" />
                <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl metal-border text-gold transition-transform duration-500 group-hover:scale-110">
                  <item.icon size={22} />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-silver">{item.title}</h3>
                <p className="text-sm leading-relaxed text-metal">{item.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
