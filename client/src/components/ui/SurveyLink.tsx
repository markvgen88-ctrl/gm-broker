import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useSectionNavigate } from "@/hooks/useSectionNavigate";

interface SurveyLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> {
  children: ReactNode;
  onNavigate?: () => void;
}

/**
 * Ссылка «Пройти опрос». Это настоящая ссылка на /#wizard (работает в новой
 * вкладке и для поисковиков), но при клике открывает опрос без перезагрузки:
 * с главной — плавно прокручивает, с любой другой страницы — переходит на
 * главную и прокручивает к анкете.
 */
export function SurveyLink({ children, onNavigate, ...rest }: SurveyLinkProps) {
  const goToSection = useSectionNavigate();
  return (
    <a
      {...rest}
      href="/#wizard"
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onNavigate?.();
        goToSection("wizard");
      }}
    >
      {children}
    </a>
  );
}
