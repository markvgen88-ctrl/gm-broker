import { getStatusDot } from "@/data/adminStatuses";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-silver",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", getStatusDot(status))} />
      {status}
    </span>
  );
}
