/**
 * Статусы заявки в CRM — обычный текст, без фиксированного перечня значений.
 * Список ниже — только подсказки для выпадающего списка на панели; можно
 * выбрать один из них или вписать свой текст, он тоже сохранится и станет
 * доступен как фильтр. Подписи совпадают 1:1 с client/src/data/adminStatuses.ts
 * (при изменении набора по умолчанию обновите оба файла).
 */
export const DEFAULT_STATUS_SUGGESTIONS = ["Новая заявка"] as const;

export const DEFAULT_STATUS: string = DEFAULT_STATUS_SUGGESTIONS[0];

const MAX_STATUS_LENGTH = 60;

/** Статус — произвольный текст, но не пустой и разумной длины. */
export function isValidStatusText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= MAX_STATUS_LENGTH;
}
