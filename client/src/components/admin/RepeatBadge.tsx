import { cn } from "@/lib/utils";

interface RepeatBadgeProps {
  earlierCount: number;
  laterCount: number;
  className?: string;
}

/**
 * Метка «повторная заявка» для списка. Если до этой заявки клиент уже
 * обращался — яркая метка с порядковым номером обращения; если это первая
 * заявка, но потом были ещё — спокойная пометка, чтобы не упустить, что
 * клиент писал снова.
 */
export function RepeatBadge({ earlierCount, laterCount, className }: RepeatBadgeProps) {
  if (earlierCount > 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-amber-300",
          className
        )}
        title={`Клиент уже обращался раньше: заявок до этой — ${earlierCount}`}
      >
        Повторная · {earlierCount + 1}-е обращение
      </span>
    );
  }
  if (laterCount > 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-white/15 px-2 py-0.5 text-[11px] whitespace-nowrap text-metal",
          className
        )}
        title="После этой заявки клиент отправлял ещё"
      >
        Есть повторные: {laterCount}
      </span>
    );
  }
  return null;
}
