import { HiArrowRight, HiOutlineCheckCircle, HiOutlineXCircle } from "react-icons/hi";
import { cta } from "@/lib/cta";
import { SurveyLink } from "@/components/ui/SurveyLink";
import type { CaseStudy } from "@/data/services";

/**
 * Разбор кейса на странице услуги: «Было → Что сделали → Результат → дальше».
 * Данные — в `caseStudy` нужной услуги (client/src/data/services.ts).
 * Необязательные блоки (extra, steps, situations, quote) не показываются, если не заданы.
 */
export function CaseStudyBlock({ data }: { data: CaseStudy }) {
  return (
    <section id="case" className="scroll-mt-16 py-14 md:py-20">
      <div className="container-page">
        <p className="inline-flex items-center rounded-full bg-pine px-4 py-1.5 text-sm font-semibold text-white">
          Разбор кейса
        </p>
        <h2 className="measure mt-5 font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.02em] text-ink md:text-5xl">
          {data.title}
        </h2>
        {data.intro && <p className="measure mt-5 text-lg leading-relaxed text-muted">{data.intro}</p>}

        {/* Результат */}
        <div className="wizard-skin mt-8 overflow-hidden rounded-2xl bg-ink p-5 text-white md:px-8 md:py-6">
          {data.requested ? (
            <div className="grid items-end gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-6">
              <div>
                <p className="text-sm text-white/60">Запрашивали</p>
                <p className="mt-1 font-display text-2xl font-bold md:text-3xl">{data.requested}</p>
              </div>
              <HiArrowRight className="hidden text-pine-bright md:block" size={28} />
              <div>
                <p className="text-sm font-semibold text-pine-bright">{data.approvedLabel ?? "Одобрено"}</p>
                <p className="mt-1 font-display text-3xl font-extrabold text-pine-bright md:text-4xl">
                  {data.approved}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold text-pine-bright">{data.approvedLabel ?? "Одобрено"}</p>
              <p className="mt-1 font-display text-4xl font-extrabold text-pine-bright md:text-5xl">
                {data.approved}
              </p>
            </div>
          )}
          <dl
            className="mt-5 grid gap-3 border-t border-white/15 pt-4"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 1fr))" }}
          >
            {data.details.map((d) => (
              <div key={d.label}>
                <dt className="text-xs text-white/60">{d.label}</dt>
                <dd className="mt-0.5 text-base font-semibold leading-snug">{d.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Было → Что сделали */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-line bg-white/80 p-7">
            <h3 className="font-display text-xl font-bold text-ink">{data.wasTitle ?? "Было"}</h3>
            {data.wasNote && <p className="mt-2 text-sm text-muted">{data.wasNote}</p>}
            <ul className="mt-5 flex flex-col gap-3">
              {data.was.map((w) => (
                <li key={w} className="flex gap-3 text-base leading-relaxed text-ink/85">
                  <HiOutlineXCircle className="mt-1 shrink-0 text-red-700/70" size={20} />
                  {w}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-mint p-7">
            <h3 className="font-display text-xl font-bold text-ink">{data.doneTitle ?? "Что сделали"}</h3>
            <ol className="mt-5 grid gap-5 sm:grid-cols-2">
              {data.done.map((d, i) => (
                <li key={d.title} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pine text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-semibold text-ink">{d.title}</span>
                    <span className="mt-1 block text-[0.95rem] leading-relaxed text-ink/80">{d.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {data.extra && (
          <div className="mt-8 rounded-3xl border border-pine/30 bg-white/80 p-7">
            <h3 className="font-display text-xl font-bold text-ink">{data.extra.title}</h3>
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {data.extra.items.map((i) => (
                <li key={i} className="flex gap-3 text-base leading-relaxed text-ink/85">
                  <HiOutlineCheckCircle className="mt-0.5 shrink-0 text-pine" size={22} />
                  {i}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.quote && (
          <blockquote className="measure mt-10 border-l-4 border-pine pl-5 font-display text-xl font-semibold leading-snug text-ink md:text-2xl">
            {data.quote}
          </blockquote>
        )}

        {data.steps && data.steps.length > 0 && (
          <div className="mt-14">
            {data.stepsTitle && (
              <h3 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
                {data.stepsTitle}
              </h3>
            )}
            {data.stepsIntro && <p className="measure mt-3 text-base leading-relaxed text-muted">{data.stepsIntro}</p>}
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.steps.map((s, i) => (
                <li key={s.title} className="rounded-2xl border border-line bg-white/80 p-5">
                  {data.stepsNumbered && <span className="text-sm font-bold text-pine">Шаг {i + 1}</span>}
                  <span className="mt-1 block font-semibold text-ink">{s.title}</span>
                  <span className="mt-1 block text-[0.95rem] leading-relaxed text-ink/80">{s.text}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {data.situations && data.situations.length > 0 ? (
            <div>
              {data.situationsTitle && <h3 className="font-display text-xl font-bold text-ink">{data.situationsTitle}</h3>}
              <ul className="mt-4 flex flex-col gap-3">
                {data.situations.map((s) => (
                  <li key={s} className="flex gap-3 text-base text-ink/85">
                    <HiOutlineCheckCircle className="mt-0.5 shrink-0 text-pine" size={22} />
                    {s}
                  </li>
                ))}
              </ul>
              {data.volume && <p className="mt-4 text-base font-medium text-ink">{data.volume}</p>}
            </div>
          ) : (
            <div className="hidden md:block" />
          )}
          <div className="rounded-3xl border border-pine/30 bg-white/80 p-7">
            <h3 className="font-display text-xl font-bold text-ink">{data.ctaTitle}</h3>
            <p className="mt-3 text-base leading-relaxed text-ink/85">{data.ctaText}</p>
            <SurveyLink className={cta("solid", "lg", "mt-6")}>
              {data.ctaButton} <HiArrowRight />
            </SurveyLink>
          </div>
        </div>

        <p className="mt-8 text-sm leading-relaxed text-muted">{data.disclaimer}</p>
      </div>
    </section>
  );
}
