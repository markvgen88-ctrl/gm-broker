import { Reveal } from "@/components/ui/Reveal";
import type { ArticleSection } from "@/types/article";

export function ArticleContent({ sections }: { sections: ArticleSection[] }) {
  return (
    <div className="flex flex-col gap-10">
      {sections.map((section, i) => (
        <Reveal key={section.heading ?? i} delay={Math.min(i * 0.04, 0.2)}>
          <div>
            {section.heading && (
              <h2 className="mb-4 font-display text-2xl font-bold text-silver md:text-[1.7rem]">
                {section.heading}
              </h2>
            )}
            <div className="flex flex-col gap-4">
              {section.paragraphs.map((p, j) => (
                <p key={j} className="text-base leading-relaxed text-metal md:text-lg">
                  {p}
                </p>
              ))}
            </div>
            {section.list && (
              <ul className="mt-4 flex flex-col gap-3">
                {section.list.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-base leading-relaxed text-metal md:text-lg">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>
      ))}
    </div>
  );
}
