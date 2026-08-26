export interface ArticleSection {
  heading?: string;
  paragraphs: string[];
  list?: string[];
}

/**
 * Кастомный блок призыва к действию в конце статьи. Если не задан,
 * ArticlePage показывает стандартный блок «Проверить шансы» со
 * ссылкой на анкету сайта. Задавайте cta, когда статья должна вести
 * не на анкету, а по внешней ссылке — например, на партнёрский сервис.
 */
export interface ArticleCta {
  title: string;
  description: string;
  buttonText: string;
  href: string;
  /** Открывать ли ссылку в новой вкладке (для внешних ссылок — true). */
  external?: boolean;
}

export interface Article {
  slug: string;
  title: string;
  /** Короткое описание для карточки статьи и meta description (150-160 символов). */
  description: string;
  /** Дата публикации в формате YYYY-MM-DD. */
  publishedAt: string;
  /** Время чтения в минутах, для карточки. */
  readingMinutes: number;
  /** Короткая подпись категории (например, «Безопасность»). */
  category: string;
  sections: ArticleSection[];
  /** Кастомный CTA в конце статьи — см. ArticleCta. */
  cta?: ArticleCta;
}
