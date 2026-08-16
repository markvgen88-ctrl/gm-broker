/**
 * Этапы воронки заявок в CRM. Список id/label синхронизирован вручную с
 * server/src/lib/statuses.ts (по аналогии с FIELD_LABELS/questionnaire.ts) —
 * при изменении статусов обновите оба файла. Цвета — только клиентские,
 * серверу не нужны.
 */
export interface AdminStatus {
  id: string;
  label: string;
  dotClassName: string;
}

export const ADMIN_STATUSES: AdminStatus[] = [
  { id: "new", label: "Новая заявка", dotClassName: "bg-sky-400" },
  { id: "in_progress", label: "В работе", dotClassName: "bg-amber-400" },
  { id: "docs_collected", label: "Документы собраны", dotClassName: "bg-amber-300" },
  { id: "sent_to_bank", label: "Отправлено в банк", dotClassName: "bg-violet-400" },
  { id: "approved", label: "Одобрено", dotClassName: "bg-emerald-400" },
  { id: "declined", label: "Отказ банка", dotClassName: "bg-rose-500" },
  { id: "client_lost", label: "Клиент отказался", dotClassName: "bg-neutral-500" },
  { id: "deal_closed", label: "Сделка закрыта", dotClassName: "bg-[var(--color-gold)]" },
];

export const ADMIN_STATUS_MAP: Record<string, AdminStatus> = Object.fromEntries(
  ADMIN_STATUSES.map((s) => [s.id, s])
);

export function getAdminStatus(id: string): AdminStatus {
  return ADMIN_STATUS_MAP[id] ?? { id, label: id, dotClassName: "bg-neutral-500" };
}
