/**
 * Письма клиенту из CRM: вспомогательные функции (без обращения к базе и SMTP).
 */

/** Максимальный суммарный размер вложений одного письма, байт. */
export const MAX_TOTAL_ATTACHMENTS_BYTES = 10 * 1024 * 1024;
/** Максимум файлов, загружаемых с компьютера (договоры из истории считаются отдельно). */
export const MAX_UPLOADED_FILES = 5;
/** Максимум договоров из истории заявки в одном письме. */
export const MAX_CONTRACTS_PER_MESSAGE = 3;

/**
 * Разрешённые расширения вложений: документы, таблицы, картинки, архивы.
 * Исполняемые и скриптовые файлы (.exe, .bat, .js, .html и т. п.) не пропускаем.
 */
const ALLOWED_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "xls", "xlsx", "odt", "ods", "rtf", "txt", "csv",
  "jpg", "jpeg", "png", "gif", "webp", "heic",
  "zip", "rar", "7z",
]);

export function isAllowedAttachmentName(name: string): boolean {
  const dot = name.lastIndexOf(".");
  if (dot < 0 || dot === name.length - 1) return false;
  return ALLOWED_EXTENSIONS.has(name.slice(dot + 1).toLowerCase());
}

/**
 * multer отдаёт имя файла в кодировке latin1, из-за чего кириллица портится
 * («РџР°СЃРїРѕСЂС‚.pdf»). Если строка при обратном разборе даёт корректный
 * UTF-8 — возвращаем исправленное имя, иначе оставляем как есть.
 */
export function fixFilenameEncoding(name: string): string {
  if (/[^\u0000-\u00ff]/.test(name)) return name; // уже настоящий Unicode
  const decoded = Buffer.from(name, "latin1").toString("utf8");
  return decoded.includes("\uFFFD") ? name : decoded;
}

/** Убирает пути, управляющие символы и лишнюю длину; оставляет расширение. */
export function sanitizeAttachmentName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? name;
  const cleaned = base.replace(/[\u0000-\u001f\u007f"<>:*?|]/g, "_").trim();
  if (cleaned.length <= 120) return cleaned || "file";
  const dot = cleaned.lastIndexOf(".");
  const ext = dot > 0 ? cleaned.slice(dot) : "";
  return cleaned.slice(0, 120 - ext.length) + ext;
}

export function isPlausibleEmail(value: string): boolean {
  const v = value.trim();
  return v.length <= 254 && /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]{2,}$/.test(v);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Делает ссылки в уже экранированном тексте кликабельными (в простом тексте письма они и так видны). */
function linkify(escaped: string): string {
  return escaped.replace(/https?:\/\/[^\s<]+/g, (url) => {
    const trailing = url.match(/[.,:!?)]+$/)?.[0] ?? "";
    const clean = trailing ? url.slice(0, -trailing.length) : url;
    return `<a href="${clean}" style="color:#1a5fb4">${clean}</a>${trailing}`;
  });
}

/** Простой текст → аккуратный HTML: пустая строка делит абзацы, перенос строки — <br>. */
export function textToHtml(text: string): string {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px 0">${linkify(escapeHtml(p)).replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a">${paragraphs}</div>`;
}
