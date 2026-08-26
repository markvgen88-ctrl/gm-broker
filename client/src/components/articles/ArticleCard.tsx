import { Link } from "react-router-dom";
import { HiOutlineArrowRight, HiOutlineClock } from "react-icons/hi";
import { Reveal } from "@/components/ui/Reveal";
import type { Article } from "@/types/article";

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(iso)
  );
}

export function ArticleCard({ article, delay = 0 }: { article: Article; delay?: number }) {
  return (
    <Reveal delay={delay}>
      <Link
        to={`/articles/${article.slug}`}
        className="group flex h-full flex-col rounded-2xl border border-white/6 bg-graphite/30 p-7 transition-all duration-400 hover:-translate-y-1 hover:border-gold/30 hover:bg-graphite/60 md:p-8"
      >
        <span className="eyebrow">{article.category}</span>
        <h3 className="mt-3 font-display text-xl font-semibold leading-snug text-silver md:text-2xl">
          {article.title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-metal md:text-base">{article.description}</p>
        <div className="mt-6 flex items-center justify-between text-xs text-metal/70">
          <span className="flex items-center gap-4">
            <span>{formatDate(article.publishedAt)}</span>
            <span className="flex items-center gap-1.5">
              <HiOutlineClock /> {article.readingMinutes} мин чтения
            </span>
          </span>
          <span className="flex items-center gap-1.5 font-medium text-gold transition-transform duration-300 group-hover:translate-x-1">
            Читать <HiOutlineArrowRight />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}
