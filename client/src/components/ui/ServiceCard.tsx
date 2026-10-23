import { HiArrowRight } from "react-icons/hi";
import { ServiceLink } from "@/components/ui/ServiceLink";
import type { Service } from "@/data/services";

/** Плитка услуги: иконка, название, краткое описание и «Подробнее». */
export function ServiceCard({ service: s }: { service: Service }) {
  return (
    <ServiceLink
      service={s}
      className="group flex h-full w-full flex-col rounded-2xl text-left border border-line bg-paper p-6 transition-colors hover:border-pine hover:bg-mint"
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-pine ring-1 ring-line group-hover:ring-pine/30">
        <s.icon size={22} />
      </span>
      <span className="mt-5 font-display text-lg font-semibold leading-snug text-ink">{s.title}</span>
      <span className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-muted">{s.short}</span>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-pine">
        Подробнее <HiArrowRight className="transition-transform group-hover:translate-x-1" />
      </span>
    </ServiceLink>
  );
}
