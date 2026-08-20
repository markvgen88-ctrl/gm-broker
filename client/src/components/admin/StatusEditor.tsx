import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { FiCheck, FiChevronDown, FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { ADMIN_STATUS_SUGGESTIONS, getStatusDot } from "@/data/adminStatuses";
import { forgetCustomStatus, getCustomStatuses, rememberCustomStatus } from "@/lib/customStatusStore";
import { cn } from "@/lib/utils";

interface StatusEditorProps {
  status: string;
  saving?: boolean;
  onChange: (nextStatus: string) => void | Promise<void>;
}

/**
 * Кнопка со статусом заявки + выпадающее меню: выбор одного из стандартных
 * статусов, любого ранее добавленного «своего» (с мусоркой — убрать из
 * подсказок), плюс форма добавления нового. Заменяет прежнюю пару
 * инпут+даталист+кнопка «Сохранить».
 */
export function StatusEditor({ status, saving, onChange }: StatusEditorProps) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [customStatuses, setCustomStatuses] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const refreshCustom = () => {
    const list = getCustomStatuses();
    const isStandard = ADMIN_STATUS_SUGGESTIONS.some((s) => s.label === status);
    if (!isStandard && status && !list.includes(status)) {
      rememberCustomStatus(status);
      setCustomStatuses([...list, status]);
    } else {
      setCustomStatuses(list);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(refreshCustom, [status]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: globalThis.MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setAdding(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const pick = async (label: string) => {
    setOpen(false);
    setAdding(false);
    if (label === status) return;
    await onChange(label);
  };

  const handleAddConfirm = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    rememberCustomStatus(trimmed);
    setDraft("");
    await pick(trimmed);
    refreshCustom();
  };

  const handleRemove = (label: string, e: MouseEvent) => {
    e.stopPropagation();
    forgetCustomStatus(label);
    refreshCustom();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className={cn(
          "flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm text-silver transition-colors",
          "hover:border-gold/50 disabled:cursor-not-allowed disabled:opacity-60"
        )}
      >
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", getStatusDot(status))} />
        <span className="max-w-[10rem] truncate">{saving ? "Сохраняем…" : status}</span>
        <FiChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-metal transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#141414] p-1.5 shadow-xl shadow-black/60">
          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-gold transition-colors hover:bg-white/[0.06]"
            >
              <FiPlus className="h-4 w-4 shrink-0" />
              Добавить статус
            </button>
          ) : (
            <div className="flex items-center gap-1.5 p-1">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddConfirm();
                  if (e.key === "Escape") {
                    setAdding(false);
                    setDraft("");
                  }
                }}
                placeholder="Название статуса"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-sm text-silver outline-none focus:border-gold/60"
              />
              <button
                type="button"
                onClick={handleAddConfirm}
                disabled={!draft.trim()}
                aria-label="Сохранить статус"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold/90 text-[#1a1400] transition-opacity disabled:opacity-40"
              >
                <FiCheck className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setDraft("");
                }}
                aria-label="Отмена"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-metal hover:text-silver"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="my-1 h-px bg-white/10" />

          <div className="max-h-72 overflow-y-auto">
            {ADMIN_STATUS_SUGGESTIONS.map((s) => (
              <StatusRow key={s.label} label={s.label} dot={s.dotClassName} active={s.label === status} onClick={() => pick(s.label)} />
            ))}
            {customStatuses.map((label) => (
              <StatusRow
                key={label}
                label={label}
                dot={getStatusDot(label)}
                active={label === status}
                onClick={() => pick(label)}
                onRemove={(e) => handleRemove(label, e)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusRow({
  label,
  dot,
  active,
  onClick,
  onRemove,
}: {
  label: string;
  dot: string;
  active: boolean;
  onClick: () => void;
  onRemove?: (e: MouseEvent) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={cn(
        "group flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
        active ? "bg-gold/10 text-gold" : "text-silver hover:bg-white/[0.06]"
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {active && <FiCheck className="h-3.5 w-3.5 shrink-0" />}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Убрать статус «${label}» из списка`}
          className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-metal transition-colors hover:text-rose-400"
        >
          <FiTrash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
