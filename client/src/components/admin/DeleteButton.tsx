import type { MouseEvent } from "react";
import { FiTrash2 } from "react-icons/fi";
import { cn } from "@/lib/utils";

/** Маленькая кнопка-мусорка для строки списка заявок в CRM. */
export function DeleteButton({
  onClick,
  disabled,
  className,
}: {
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Удалить заявку"
      title="Удалить заявку"
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-metal transition-colors",
        "hover:border-rose-400/60 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      <FiTrash2 className="h-3.5 w-3.5" />
    </button>
  );
}
