import { Navigate, useParams } from "react-router-dom";
import { HiArrowLeft, HiOutlineClock } from "react-icons/hi";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ArticleContent } from "@/components/articles/ArticleContent";
import { getArticleBySlug } from "@/data/articles";
import { useSeo } from "@/hooks/useSeo";
import { useSectionNavigate } from "@/hooks/useSectionNavigate";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(iso)
  );
}

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;
  const goToSection = useSectionNavigate();

  useSeo({
    title: article ? `${article.title} — G.M. Broker` : "Статья не найдена — G.M. Broker",
    description: article?.description ?? "",
    canonicalPath: `/articles/${slug ?? ""}`,
    jsonLd: article
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.description,
          datePublished: article.publishedAt,
          author: { "@type": "Organization", name: "G.M. Broker" },
          publisher: { "@type": "Organization", name: "G.M. Broker" },
          mainEntityOfPage: `https://gm-broker.ru/articles/${article.slug}`,
        }
      : undefined,
  });

  if (!article) {
    return <Navigate to="/articles" replace />;
  }

  return (
    <main className="pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <a
              href="/articles"
              className="inline-flex items-center gap-2 text-sm font-medium text-metal transition-colors hover:text-gold"
            >
              <HiArrowLeft /> Все статьи
            </a>
          </Reveal>

          <Reveal delay={0.06}>
            <span className="eyebrow mt-8 block">{article.category}</span>
            <h1 className="mt-3 font-display text-3xl font-bold leading-[1.15] text-silver sm:text-4xl md:text-[2.6rem]">
              {article.title}
            </h1>
            <div className="mt-5 flex items-center gap-5 text-sm text-metal/70">
              <span>{formatDate(article.publishedAt)}</span>
              <span className="flex items-center gap-1.5">
                <HiOutlineClock /> {article.readingMinutes} мин чтения
              </span>
            </div>
          </Reveal>

          <div className="hairline my-10" />

          <ArticleContent sections={article.sections} />

          <Reveal delay={0.1}>
            <div className="mt-14 metal-border rounded-2xl p-7 text-center md:p-10">
              <h3 className="font-display text-xl font-semibold text-silver md:text-2xl">
                Хотите узнать свои реальные шансы на кредит?
              </h3>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-metal md:text-base">
                Пройдите короткий опрос — честно оценю вашу ситуацию и подскажу оптимальный путь, без лишних действий.
              </p>
              <Button size="lg" className="mt-6" onClick={() => goToSection("wizard")}>
                Проверить шансы
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
