import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: ReactNode;
  description?: ReactNode;
  /** Малая подпись над заголовком (необязательно). */
  eyebrow?: string;
  tone?: "light" | "dark";
  className?: string;
}

export function SectionHeading({ title, description, eyebrow, tone = "light", className }: SectionHeadingProps) {
  const dark = tone === "dark";
  return (
    <div className={cn("max-w-3xl", className)}>
      {eyebrow && (
        <p className={cn("mb-3 text-sm font-semibold", dark ? "text-pine-bright" : "text-pine")}>{eyebrow}</p>
      )}
      <h2
        className={cn(
          "font-display text-[1.9rem] font-bold leading-[1.12] tracking-[-0.025em] sm:text-4xl md:text-[2.7rem]",
          dark ? "text-white" : "text-ink"
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn("measure mt-4 text-base leading-relaxed md:text-lg", dark ? "text-white/70" : "text-muted")}>
          {description}
        </p>
      )}
    </div>
  );
}
