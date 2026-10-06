import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Оставлены для совместимости со старым API. */
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "span";
}

/**
 * В новом дизайне блоки не «выезжают» при прокрутке: контент виден сразу.
 * Компонент оставлен как обёртка, чтобы не менять места, где он используется.
 */
export function Reveal({ children, className }: RevealProps) {
  return <div className={className}>{children}</div>;
}
