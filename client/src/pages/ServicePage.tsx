import { Link, Navigate, useParams } from "react-router-dom";
import { HiArrowLeft, HiArrowRight, HiOutlineClock, HiOutlineInformationCircle } from "react-icons/hi";
import { cta } from "@/lib/cta";
import { SurveyLink } from "@/components/ui/SurveyLink";
import { GROUP_TITLES, SERVICES, getServiceBySlug } from "@/data/services";
import { useSeo } from "@/hooks/useSeo";

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="font-display text-xl font-bold tracking-tight text-ink">{title}</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((i) => (
          <li key={i} className="flex gap-3 text-base leading-relaxed text-ink/85">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pine" />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServicePage() {
  const { slug } = useParams<{ slug: string }>();
  const service = slug ? getServiceBySlug(slug) : undefined;

  useSeo({
    title: service ? `${service.title} — G.M. Broker` : "G.M. Broker",
    description: service ? service.lead : "",
    canonicalPath: `/services/${slug ?? ""}`,
    jsonLd: service
      ? {
          "@context": "https://schema.org",
          "@type": "Service",
          name: service.title,
          description: service.lead,
          provider: { "@type": "FinancialService", name: "G.M. Broker", url: "https://gm-broker.ru/" },
          areaServed: { "@type": "Country", name: "Россия" },
        }
      : undefined,
  });

  if (!service) return <Navigate to="/#services" replace />;

  const others = SERVICES.filter((s) => s.slug !== service.slug);

  return (
    <main className="pt-[4.25rem]">
      <div className="container-page pb-16 pt-10 md:pt-14">
        <Link to="/#services" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-pine">
          <HiArrowLeft /> Все виды кредитования
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-pine">{GROUP_TITLES[service.group]}</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-ink md:text-6xl">
              {service.title}
            </h1>
            <p className="measure mt-6 text-lg leading-relaxed text-muted">{service.lead}</p>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <SurveyLink className={cta("solid", "lg", "w-full lg:w-auto")}>
              Пройти опрос <HiArrowRight />
            </SurveyLink>
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <HiOutlineClock className="text-pine" /> около 2 минут, без предоплаты
            </p>
          </div>
        </div>
      </div>

      <section className="bg-white py-14 md:py-20">
        <div className="container-page grid gap-12 md:grid-cols-3">
          <List title="Кому подходит" items={service.forWhom} />
          <List title="Что я делаю" items={service.whatIDo} />
          <List title="Что понадобится" items={service.prepare} />
        </div>

        {(service.note || service.article) && (
          <div className="container-page mt-12 grid gap-4 md:grid-cols-2">
            {service.note && (
              <div className="flex gap-3 rounded-2xl bg-mint p-5 text-[0.95rem] leading-relaxed text-ink">
                <HiOutlineInformationCircle className="mt-0.5 shrink-0 text-pine" size={22} />
                {service.note}
              </div>
            )}
            {service.article && (
              <Link
                to={`/articles/${service.article.slug}`}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-line p-5 font-medium text-ink hover:border-pine"
              >
                <span>
                  <span className="block text-sm font-normal text-muted">Статья по теме</span>
                  {service.article.label}
                </span>
                <HiArrowRight className="shrink-0 text-pine transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Приглашение пройти опрос */}
      <section className="wizard-skin bg-ink py-16 text-white md:py-20">
        <div className="container-page grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              Узнайте, подойдёт ли вам этот вариант
            </h2>
            <p className="measure mt-4 text-base leading-relaxed text-white/70 md:text-lg">
              Ответьте на несколько вопросов. Я изучу вашу ситуацию, свяжусь в течение 24 часов и честно скажу о
              шансах. Если помочь не смогу, дам бесплатную рекомендацию.
            </p>
          </div>
          <div className="md:justify-self-end">
            <SurveyLink className={cta("bright", "lg")}>
              Пройти опрос <HiArrowRight />
            </SurveyLink>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container-page">
          <h2 className="font-display text-2xl font-bold tracking-tight text-ink">Другие виды кредитования</h2>
          <ul className="mt-6 flex flex-wrap gap-2.5">
            {others.map((s) => (
              <li key={s.slug}>
                <Link
                  to={`/services/${s.slug}`}
                  className="inline-flex rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:border-pine hover:bg-mint"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
