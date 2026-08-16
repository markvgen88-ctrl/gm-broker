/**
 * Этапы воронки заявок в CRM. Это источник истины для валидации на сервере —
 * человекочитаемые подписи и цвета для админ-панели продублированы на клиенте
 * в client/src/data/adminStatuses.ts (по аналогии с FIELD_LABELS/questionnaire.ts:
 * при изменении списка статусов обновите оба файла).
 */
export const STATUSES = [
  { id: "new", label: "Новая заявка" },
  { id: "in_progress", label: "В работе" },
  { id: "docs_collected", label: "Документы собраны" },
  { id: "sent_to_bank", label: "Отправлено в банк" },
  { id: "approved", label: "Одобрено" },
  { id: "declined", label: "Отказ банка" },
  { id: "client_lost", label: "Клиент отказался" },
  { id: "deal_closed", label: "Сделка закрыта" },
] as const;

export type StatusId = (typeof STATUSES)[number]["id"];

const STATUS_ID_SET = new Set<string>(STATUSES.map((s) => s.id));

export function isValidStatus(value: unknown): value is StatusId {
  return typeof value === "string" && STATUS_ID_SET.has(value);
}

export const DEFAULT_STATUS: StatusId = "new";
