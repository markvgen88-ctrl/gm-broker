import { cn } from "@/lib/utils";

type Variant = "solid" | "ink" | "outline" | "bright" | "ghost-light";
type Size = "sm" | "md" | "lg";

/**
 * Классы кнопок публичного сайта. Применяются и к <button>, и к <a>/<Link>,
 * чтобы кнопка-ссылка выглядела так же, как кнопка-действие.
 */
export function cta(variant: Variant = "solid", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" && "px-4 py-2.5 text-sm",
    size === "md" && "px-6 py-3 text-[0.95rem]",
    size === "lg" && "px-8 py-4 text-base",
    variant === "solid" && "bg-pine text-white hover:bg-pine-deep",
    variant === "ink" && "bg-ink text-white hover:bg-ink-soft",
    variant === "outline" && "border border-ink/25 text-ink hover:border-ink hover:bg-white",
    variant === "bright" && "bg-pine-bright text-ink hover:bg-white",
    variant === "ghost-light" && "border border-white/25 text-white hover:border-white/60 hover:bg-white/5",
    className
  );
}
