import type { LeadStatus } from "@/lib/adminApi";

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "in_progress",
  "waiting_docs",
  "submitted",
  "approved",
  "declined",
  "issued",
  "archived",
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  waiting_docs: "Ждём документы",
  submitted: "Подана в банк",
  approved: "Одобрено",
  declined: "Отказ",
  issued: "Выдано",
  archived: "Архив",
};

/** Цвет точки-индикатора статуса в таблице заявок. */
export const LEAD_STATUS_DOT_COLOR: Record<LeadStatus, string> = {
  new: "bg-[#7dc4f0]",
  in_progress: "bg-gold",
  waiting_docs: "bg-[#e5b96a]",
  submitted: "bg-[#c5c5c5]",
  approved: "bg-[#7fce9a]",
  declined: "bg-[#e5a3a3]",
  issued: "bg-[#7fce9a]",
  archived: "bg-white/30",
};

export const CLIENT_TYPE_LABELS: Record<string, string> = {
  individual: "Физлицо",
  entrepreneur: "ИП",
  legal_entity: "ООО",
};
