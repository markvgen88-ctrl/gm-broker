export interface ArticleSection {
  heading?: string;
  paragraphs: string[];
  list?: string[];
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
}
