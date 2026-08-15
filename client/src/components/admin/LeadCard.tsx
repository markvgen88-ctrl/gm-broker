import { useState } from "react";
import type { FormEvent } from "react";
import { HiChevronDown, HiOutlinePhone, HiOutlineMail } from "react-icons/hi";
import { cn } from "@/lib/utils";
import { FIELD_LABELS, FIELD_ORDER, formatFieldValue } from "@/lib/leadFields";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_STATUS_DOT_COLOR, CLIENT_TYPE_LABELS } from "@/lib/leadStatus";
import { fetchLeadNotes, addLeadNote, updateLeadStatus } from "@/lib/adminApi";
import type { Lead, LeadNote, LeadStatus } from "@/lib/adminApi";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Moscow" }).format(d);
}

interface LeadCardProps {
  lead: Lead;
  onStatusChange: (id: number, lead: Lead) => void;
}

export function LeadCard({ lead, onStatusChange }: LeadCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState<LeadNote[] | null>(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  let answers: Record<string, string | number> = {};
  try {
    answers = JSON.parse(lead.answers_json);
  } catch {
    answers = {};
  }

  const rows = FIELD_ORDER.filter((key) => answers[key] !== undefined && answers[key] !== "").map((key) => ({
    label: FIELD_LABELS[key] ?? key,
    value: formatFieldValue(key, answers[key]),
  }));

  async function toggleOpen() {
    const next = !isOpen;
    setIsOpen(next);
    if (next && notes === null) {
      setNotesLoading(true);
      setNotesError(null);
      try {
        setNotes(await fetchLeadNotes(lead.id));
      } catch (err) {
        setNotesError(err instanceof Error ? err.message : "Не удалось загрузить заметки");
      } finally {
        setNotesLoading(false);
      }
    }
  }

  async function handleStatusChange(newStatus: LeadStatus) {
    if (newStatus === lead.status || statusUpdating) return;
    setStatusUpdating(true);
    try {
      const updated = await updateLeadStatus(lead.id, newStatus);
      onStatusChange(lead.id, updated);
    } catch {
      // молча игнорируем — селект вернётся к прежнему значению при следующем рендере
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleAddNote(e: FormEvent) {
    e.preventDefault();
    const text = noteText.trim();
    if (!text || isAddingNote) return;
    setIsAddingNote(true);
    setNotesError(null);
    try {
      const note = await addLeadNote(lead.id, text);
      setNotes((prev) => [note, ...(prev ?? [])]);
      setNoteText("");
    } catch (err) {
      setNotesError(err instanceof Error ? err.message : "Не удалось сохранить заметку");
    } finally {
      setIsAddingNote(false);
    }
  }

  return (
    <div className="glass-panel metal-border overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={toggleOpen}
        className="flex w-full flex-col gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.03] md:flex-row md:items-center md:gap-5 md:px-6"
      >
        <div className="flex items-center gap-2 text-xs text-metal md:w-36 md:shrink-0">
          <span className={cn("h-2 w-2 shrink-0 rounded-full", LEAD_STATUS_DOT_COLOR[lead.status])} />
          {formatDateTime(lead.created_at)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-display font-semibold text-silver">{lead.name}</span>
            <span className="rounded-full border border-white/12 px-2 py-0.5 text-[11px] uppercase tracking-wide text-metal">
              {CLIENT_TYPE_LABELS[lead.client_type] ?? lead.client_type}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-metal">
            <span className="inline-flex items-center gap-1.5">
              <HiOutlinePhone className="shrink-0" /> {lead.phone}
            </span>
            <span className="inline-flex items-center gap-1.5 truncate">
              <HiOutlineMail className="shrink-0" /> {lead.email}
            </span>
          </div>
        </div>

        {lead.loan_amount && (
          <div className="text-sm font-semibold text-gold md:w-36 md:shrink-0 md:text-right">{lead.loan_amount}</div>
        )}

        <div className="flex items-center gap-3 md:w-56 md:shrink-0 md:justify-end" onClick={(e) => e.stopPropagation()}>
          <select
            value={lead.status}
            disabled={statusUpdating}
            onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
            className="w-full rounded-lg border border-white/12 bg-graphite/60 px-3 py-2 text-sm text-silver focus:border-gold/60 focus:outline-none disabled:opacity-50 md:w-auto"
          >
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status} className="bg-graphite text-silver">
                {LEAD_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <HiChevronDown className={cn("hidden shrink-0 text-metal transition-transform md:block", isOpen && "rotate-180")} />
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-white/10 px-5 py-5 md:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="eyebrow mb-3">Анкета</p>
              <div className="overflow-hidden rounded-xl border border-white/10">
                {rows.map((r, i) => (
                  <div
                    key={r.label}
                    className={cn(
                      "flex items-start justify-between gap-4 px-4 py-2.5 text-sm",
                      i % 2 === 0 ? "bg-white/[0.02]" : ""
                    )}
                  >
                    <span className="text-metal">{r.label}</span>
                    <span className="text-right font-medium text-silver">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="eyebrow mb-3">Заметки по клиенту</p>

              <form onSubmit={handleAddNote} className="mb-4">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Например: позвонил, ждём справку 2-НДФЛ…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/12 bg-graphite/60 px-4 py-3 text-sm text-silver placeholder:text-metal/50 focus:border-gold/60 focus:outline-none"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={!noteText.trim() || isAddingNote}
                    className="rounded-full bg-gradient-to-r from-[#f4e5b3] via-gold to-gold-deep px-5 py-2 text-sm font-semibold text-[#1a1400] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isAddingNote ? "Сохраняем…" : "Добавить заметку"}
                  </button>
                </div>
              </form>

              {notesError && <p className="mb-3 text-sm text-[#e5a3a3]">{notesError}</p>}

              {notesLoading && <p className="text-sm text-metal">Загружаем заметки…</p>}

              {!notesLoading && notes && notes.length === 0 && (
                <p className="text-sm text-metal">Заметок пока нет.</p>
              )}

              {!notesLoading && notes && notes.length > 0 && (
                <ul className="space-y-3">
                  {notes.map((note) => (
                    <li key={note.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                      <p className="whitespace-pre-wrap text-sm text-silver">{note.text}</p>
                      <p className="mt-1.5 text-xs text-metal">{formatDateTime(note.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
