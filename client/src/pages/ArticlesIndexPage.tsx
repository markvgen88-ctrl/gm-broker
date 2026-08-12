import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { articles } from "@/data/articles";
import { useSeo } from "@/hooks/useSeo";

export function ArticlesIndexPage() {
  useSeo({
    title: "Статьи о кредитах, безопасности и финансах — G.M. Broker",
    description:
      "Полезные статьи от кредитного брокера: как распознать мошеннические схемы, разобраться в кредитных продуктах и не попасть в ловушку недобросовестных посредников.",
    canonicalPath: "/articles",
  });

  return (
    <main className="pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="container-page">
        <SectionHeading
          eyebrow="Блог"
          title="Статьи о кредитах и финансовой безопасности"
          description="Разбираю реальные ситуации из практики — чтобы вы могли принимать решения осознанно."
          className="mb-16"
        />

        {articles.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, i) => (
              <ArticleCard key={article.slug} article={article} delay={(i % 3) * 0.08} />
            ))}
          </div>
        ) : (
          <p className="text-center text-metal">Статьи скоро появятся.</p>
        )}
      </div>
    </main>
  );
}
