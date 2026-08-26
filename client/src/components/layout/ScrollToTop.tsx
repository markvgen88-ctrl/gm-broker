import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * При переходе на новый маршрут без якоря (#section) сбрасывает прокрутку
 * страницы в самый верх — ожидаемое поведение при переходе на новую
 * "страницу" сайта. Если в адресе есть #section (например, /#wizard) —
 * не вмешивается, скролл к нужной секции берёт на себя сама страница.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}
