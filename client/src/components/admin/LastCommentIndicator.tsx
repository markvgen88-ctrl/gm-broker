import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiMessageCircle } from "react-icons/fi";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Moscow",
});

interface LastCommentIndicatorProps {
  comment: { text: string; createdAt: string } | null;
}

/**
 * Маленькая иконка-комментарий в строке заявки. При наведении (или фокусе
 * с клавиатуры) показывает текст последнего добавленного комментария.
 * Подсказка рендерится через портал в document.body, а не внутри таблицы —
 * иначе её обрезал бы overflow-hidden у обёртки таблицы со скруглёнными
 * углами.
 */
export function LastCommentIndicator({ comment }: LastCommentIndicatorProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ bottom: number; right: number } | null>(null);
  const iconRef = useRef<HTMLButtonElement>(null);

  if (!comment) return null;

  const show = () => {
    const rect = iconRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      bottom: window.innerHeight - rect.top + 8,
      right: window.innerWidth - rect.right,
    });
    setOpen(true);
  };

  const hide = () => setOpen(false);

  return (
    <>
      <button
        ref={iconRef}
        type="button"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-metal transition-colors",
          "hover:border-gold/50 hover:text-gold"
        )}
        aria-label="Последний комментарий"
      >
        <FiMessageCircle className="h-3.5 w-3.5" />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            role="tooltip"
            style={{ position: "fixed", bottom: pos.bottom, right: pos.right }}
            className="pointer-events-none z-50 w-64 rounded-xl border border-white/10 bg-[#141414] p-3 text-left text-xs shadow-xl shadow-black/50"
          >
            <p className="mb-1 text-[10px] uppercase tracking-wide text-metal">
              {dateFormatter.format(new Date(comment.createdAt))}
            </p>
            <p className="whitespace-pre-wrap text-silver">{comment.text}</p>
          </div>,
          document.body
        )}
    </>
  );
}
