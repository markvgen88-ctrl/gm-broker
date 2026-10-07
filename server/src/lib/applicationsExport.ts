import ExcelJS from "exceljs";
import { FIELD_LABELS, FIELD_ORDER, formatFieldValue } from "./fields.js";

/** Строка для выгрузки: заявка + все комментарии и договоры по ней. */
export interface ExportRow {
  id: number;
  createdAt: Date;
  status: string;
  clientType: string;
  name: string;
  phone: string;
  email: string;
  answers: Record<string, string | number>;
  comments: { text: string; at: Date }[];
  contracts: { num: number; at: Date }[];
}

// Поля анкеты, которые уже вынесены в отдельные колонки слева.
const LEADING_FIELDS = new Set(["clientType", "name", "phone", "contactInfo"]);

// В анкете у ИП и ООО подпись «Оборот по счету в месяц» одинаковая — на
// одном листе такие колонки нужно различать.
const HEADER_OVERRIDES: Record<string, string> = {
  ipTurnover: "Оборот по счету в месяц (ИП)",
  orgTurnover: "Оборот по счету в месяц (ООО)",
};

const MONEY_FORMAT = '#,##0 "₽"';
const MONEY_FIELDS = new Set([
  "officialIncome",
  "unofficialIncome",
  "loanBalance",
  "monthlyPayments",
  "biggestPaidLoan",
  "loanAmount",
  "ipTurnover",
  "orgTurnover",
  "netProfit",
]);

const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;

/**
 * Excel не хранит часовой пояс, поэтому сдвигаем время на московское
 * (UTC+3, без перехода на летнее) — в ячейке будет то время, которое
 * видно в панели.
 */
function toMoscowCell(date: Date): Date {
  return new Date(date.getTime() + MSK_OFFSET_MS);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatMoscow(date: Date): string {
  const d = toMoscowCell(date);
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function formatMoscowDate(date: Date): string {
  const d = toMoscowCell(date);
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}

/** Дата для имени файла по Москве, ГГГГ-ММ-ДД. */
export function moscowDateStamp(date: Date = new Date()): string {
  const d = toMoscowCell(date);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Значение ячейки для поля анкеты: числа (деньги, возраст) остаются числами, остальное — читаемый текст. */
function answerCell(field: string, raw: unknown): { value: ExcelJS.CellValue; numFmt?: string } {
  if (raw === undefined || raw === null || raw === "") return { value: "" };
  if (MONEY_FIELDS.has(field)) {
    const num = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isNaN(num)) return { value: num, numFmt: MONEY_FORMAT };
  }
  if (field === "age") {
    const num = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isNaN(num)) return { value: num, numFmt: '0 "лет"' };
  }
  return { value: formatFieldValue(field, raw) };
}

/**
 * Собирает книгу Excel с одним листом «Заявки»: одна строка на клиента,
 * слева — основное (дата, статус, контакты), затем все показатели из
 * анкеты, справа — договоры и все комментарии с датами.
 */
export async function buildApplicationsWorkbook(rows: ExportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "G.M. Broker";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Заявки", {
    views: [{ state: "frozen", xSplit: 5, ySplit: 1 }],
  });

  const answerFields = FIELD_ORDER.filter((f) => !LEADING_FIELDS.has(f));

  const columns: Partial<ExcelJS.Column>[] = [
    { header: "№", key: "id", width: 7 },
    { header: "Дата заявки", key: "createdAt", width: 17, style: { numFmt: "dd.mm.yyyy hh:mm" } },
    { header: "Статус", key: "status", width: 20 },
    { header: "Тип клиента", key: "clientType", width: 12 },
    { header: "Имя", key: "name", width: 26 },
    { header: "Телефон", key: "phone", width: 18 },
    { header: "E-mail", key: "email", width: 28 },
    ...answerFields.map((f) => ({
      header: HEADER_OVERRIDES[f] ?? FIELD_LABELS[f] ?? f,
      key: `f_${f}`,
      width: 18,
    })),
    { header: "Договоры", key: "contracts", width: 24 },
    { header: "Комментарии", key: "comments", width: 70 },
  ];
  sheet.columns = columns;

  const header = sheet.getRow(1);
  header.height = 48;
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F6B54" } };
  header.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

  for (const r of rows) {
    const values: Record<string, ExcelJS.CellValue> = {
      id: r.id,
      createdAt: toMoscowCell(r.createdAt),
      status: r.status,
      clientType: formatFieldValue("clientType", r.clientType),
      name: r.name,
      phone: r.phone,
      email: r.email,
      contracts: r.contracts.map((c) => `№ ${c.num} от ${formatMoscowDate(c.at)}`).join("\n"),
      comments: r.comments.map((c) => `${formatMoscow(c.at)} — ${c.text}`).join("\n\n"),
    };
    const formats: Record<string, string> = {};
    for (const f of answerFields) {
      const cell = answerCell(f, r.answers[f]);
      values[`f_${f}`] = cell.value;
      if (cell.numFmt) formats[`f_${f}`] = cell.numFmt;
    }

    const row = sheet.addRow(values);
    row.alignment = { vertical: "top", wrapText: true };
    for (const [key, fmt] of Object.entries(formats)) {
      row.getCell(key).numFmt = fmt;
      row.getCell(key).alignment = { vertical: "top", horizontal: "right" };
    }
  }

  // Фильтры по всем столбцам — удобно отбирать по статусу, типу и т. д.
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
