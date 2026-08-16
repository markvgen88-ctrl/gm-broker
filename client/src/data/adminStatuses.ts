/**
 * Статусы заявки — обычный текст (без фиксированного перечня id). Список
 * ниже — подсказки для выпадающего списка на панели плюс цвета для бейджей;
 * синхронизирован вручную с server/src/lib/statuses.ts (при изменении
 * набора по умолчанию обновите оба файла). Пользователь может вписать и
 * свой статус — он просто не попадёт в эту цветовую карту и отобразится
 * серым бейджем со своим текстом.
 */
export interface AdminStatusSuggestion {
  label: string;
  dotClassName: string;
}

export const ADMIN_STATUS_SUGGESTIONS: AdminStatusSuggestion[] = [
  { label: "Новая заявка", dotClassName: "bg-sky-400" },
  { label: "В работе", dotClassName: "bg-amber-400" },
  { label: "Документы собраны", dotClassName: "bg-amber-300" },
  { label: "Отправлено в банк", dotClassName: "bg-violet-400" },
  { label: "Одобрено", dotClassName: "bg-emerald-400" },
  { label: "Отказ банка", dotClassName: "bg-rose-500" },
  { label: "Клиент отказался", dotClassName: "bg-neutral-500" },
  { label: "Сделка закрыта", dotClassName: "bg-[var(--color-gold)]" },
];

const DOT_BY_LABEL: Record<string, string> = Object.fromEntries(
  ADMIN_STATUS_SUGGESTIONS.map((s) => [s.label, s.dotClassName])
);

/** Цвет точки для бейджа статуса; для незнакомого (своего) статуса — серый. */
export function getStatusDot(status: string): string {
  return DOT_BY_LABEL[status] ?? "bg-neutral-500";
}
