import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { hit } from "@/lib/metrika";

/**
 * Отправляет в Метрику просмотр страницы при каждом переходе между разделами
 * сайта. Без этого Метрика видит только первую загрузку (сайт — SPA).
 *
 * - Первую загрузку не дублируем: её уже засчитал сам счётчик.
 * - Смену только якоря (#faq) за просмотр не считаем.
 * - Админку (/admin) в Метрику не отправляем.
 */
export function MetrikaPageTracker() {
  const { pathname, search } = useLocation();
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}${pathname}${search}`;
    const previous = lastUrl.current;
    lastUrl.current = url;

    if (previous === null || previous === url) return;
    if (pathname.startsWith("/admin")) return;

    // Небольшая задержка: страница сама выставляет document.title в своём
    // эффекте (useSeo), который срабатывает уже после этого. Без паузы в
    // Метрику ушёл бы заголовок предыдущей страницы.
    const timer = window.setTimeout(() => {
      hit(url, { title: document.title, referer: previous });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [pathname, search]);

  return null;
}
