import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | string): string {
  const num = typeof value === "string" ? Number(value.replace(/\s/g, "")) : value;
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat("ru-RU").format(num);
}

export function formatCurrency(value: number | string): string {
  return `${formatNumber(value)} ₽`;
}

/** Парсит человекочитаемое число из инпута (убирает пробелы). */
export function parseNumberInput(raw: string): number {
  return Number(raw.replace(/[^\d.-]/g, ""));
}

/** Считает число полных месяцев, прошедших с даты в формате YYYY-MM-DD до сегодня. */
export function fullMonthsSince(dateStr: string): number {
  const from = new Date(dateStr);
  const now = new Date();
  if (Number.isNaN(from.getTime())) return 0;

  let months = (now.getFullYear() - from.getFullYear()) * 12 + (now.getMonth() - from.getMonth());
  if (now.getDate() < from.getDate()) months -= 1;

  return Math.max(months, 0);
}
