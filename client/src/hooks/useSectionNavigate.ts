import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Возвращает функцию для перехода к секции на главной странице (по id)
 * из любого места сайта. Если пользователь уже на главной — просто
 * плавно прокручивает; если на другой странице (например, статье) —
 * сначала переходит на главную, затем прокручивает к нужной секции.
 */
export function useSectionNavigate() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    (sectionId: string) => {
      if (location.pathname === "/") {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate(`/#${sectionId}`);
      }
    },
    [location.pathname, navigate]
  );
}
