import { SectionHeading } from "@/components/ui/SectionHeading";
import { FAQ_ITEMS } from "@/data/faq";

export function FAQ() {
  return (
    <section id="faq" className="section-y scroll-mt-16">
      <div className="container-page grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <SectionHeading title="Вопросы, которые задают чаще всего" />
        <div className="divide-y divide-line border-y border-line">
          {FAQ_ITEMS.map((item, index) => (
            <details key={item.question} className="group py-5" open={index === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold tracking-tight text-ink [&::-webkit-details-marker]:hidden">
                {item.question}
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line text-xl leading-none text-pine transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="measure mt-3 text-base leading-relaxed text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
