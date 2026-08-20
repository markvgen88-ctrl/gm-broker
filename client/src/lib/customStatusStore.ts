import { ADMIN_STATUS_SUGGESTIONS } from "@/data/adminStatuses";

/**
 * Список «своих» статусов (не из стандартного набора) хранится в
 * localStorage браузера — отдельного бэкенда под это заводить не стали,
 * так как в CRM всё равно один общий вход. Список используется только для
 * подсказок в выпадающем меню статуса; сами статусы заявок как были текстом
 * в базе, так и остаются — удаление из этого списка ничего не меняет в уже
 * сохранённых заявках, только убирает вариант из подсказок на будущее.
 */
const STORAGE_KEY = "gmbroker_admin_custom_statuses";
const DEFAULT_LABELS = new Set(ADMIN_STATUS_SUGGESTIONS.map((s) => s.label));

function readRaw(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string" && s.trim() !== "") : [];
  } catch {
    return [];
  }
}

function writeRaw(list: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // localStorage может быть недоступен (приватный режим и т.п.) — не критично,
    // просто подсказки не запомнятся между визитами
  }
}

export function getCustomStatuses(): string[] {
  return readRaw().filter((s) => !DEFAULT_LABELS.has(s));
}

export function rememberCustomStatus(label: string) {
  const trimmed = label.trim();
  if (!trimmed || DEFAULT_LABELS.has(trimmed)) return;
  const current = readRaw();
  if (!current.includes(trimmed)) writeRaw([...current, trimmed]);
}

export function forgetCustomStatus(label: string) {
  writeRaw(readRaw().filter((s) => s !== label));
}

/**
 * Подмешивает статусы, реально встречающиеся в заявках (например, once
 * добавленные через старую версию редактора статуса, ещё до этого
 * дропдауна) — чтобы список подсказок не расходился с тем, что уже
 * используется на доске.
 */
export function seedCustomStatusesFromUsage(statuses: string[]) {
  const toAdd = statuses.filter((s) => s && !DEFAULT_LABELS.has(s));
  if (toAdd.length === 0) return;
  const current = readRaw();
  const merged = Array.from(new Set([...current, ...toAdd]));
  if (merged.length !== current.length) writeRaw(merged);
}
