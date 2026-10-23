import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { hit } from "@/lib/metrika";

/**
 * Отправляет в Яндекс.Метрику просмотр страницы при каждом переходе между
 * маршрутами сайта (метод hit). Без этого Метрика видит только первую загрузку
 * страницы, потому что сайт — SPA и не перезагружается при переходах.
 *
 * - Первую загрузку не дублируем: её уже засчитал сам счётчик (ym init).
 * - Смену только якоря (#section) за просмотр не считаем.
 * - Админку (/admin) в Метрику не отправляем.
 */
export function MetrikaPageTracker() {
  const { pathname, search } = useLocation();
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}${pathname}${search}`;
    const previous = lastUrl.current;
    lastUrl.current = url;

    // Первая загрузка — её считает сам счётчик; повтор того же адреса — пропускаем.
    if (previous === null || previous === url) return;
    if (pathname.startsWith("/admin")) return;

    hit(url, { title: document.title, referer: previous });
  }, [pathname, search]);

  return null;
}
