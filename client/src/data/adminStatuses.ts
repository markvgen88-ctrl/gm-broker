/**
 * Статусы заявки — обычный текст (без фиксированного перечня id). Список
 * ниже — подсказки для выпадающего списка на панели плюс цвета для бейджей;
 * синхронизирован вручную с server/src/lib/statuses.ts (при изменении
 * набора по умолчанию обновите оба файла). Пользователь может вписать и
 * свой статус — он просто не попадёт в эту цветовую карту и отобразится
 * серым бейджем со своим текстом.
 */
/**
 * Статусы заявки — обычный текст (без фиксированного перечня id). Список
 * ниже — «стандартный» статус, задаваемый заявке по умолчанию; синхронизирован
 * вручную с server/src/lib/statuses.ts (при изменении набора по умолчанию
 * обновите оба файла). Любой другой статус — «свой», пользователь вписывает
 * его текстом в редакторе статуса, он не попадает в эту цветовую карту и
 * отображается серым бейджем со своим текстом.
 */
export interface AdminStatusSuggestion {
  label: string;
  dotClassName: string;
}

export const ADMIN_STATUS_SUGGESTIONS: AdminStatusSuggestion[] = [
  { label: "Новая заявка", dotClassName: "bg-sky-400" },
];

const DOT_BY_LABEL: Record<string, string> = Object.fromEntries(
  ADMIN_STATUS_SUGGESTIONS.map((s) => [s.label, s.dotClassName])
);

/** Цвет точки для бейджа статуса; для незнакомого (своего) статуса — серый. */
export function getStatusDot(status: string): string {
  return DOT_BY_LABEL[status] ?? "bg-neutral-500";
}
