/**
 * Шаблоны писем клиенту и подпись хранятся в базе и редактируются в CRM
 * (раздел «Шаблоны писем»). Здесь остаётся только подстановка имени клиента.
 * Значения по умолчанию для первого запуска — на сервере,
 * server/src/lib/defaultEmailTemplates.ts.
 */
export function fillTemplate(text: string, name: string): string {
  return text.replace(/\{name\}/g, name.trim() || "добрый день");
}
