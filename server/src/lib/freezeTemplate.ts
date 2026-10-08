import type { FreezeRequestInput } from "./freezeValidation.js";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function moscowNow(date: Date): string {
  const d = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)}.${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

/** Тема, HTML-письмо и текст для Telegram по заявке на заморозку кредита. */
export function buildFreezeReport(data: FreezeRequestInput, receivedAt: Date = new Date()) {
  const when = moscowNow(receivedAt);
  const rows: [string, string][] = [
    ["Имя", data.name],
    ["Телефон", data.phone],
    ["E-mail", data.email],
    ["Комментарий", data.comment || "не указан"],
    ["Получена", `${when} (МСК)`],
  ];

  const subject = `Заявка: заморозка кредитного договора — ${data.name}`;

  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f5f6f2;font-family:Arial,Helvetica,sans-serif;color:#0f1e19;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
    <tr><td style="background:#0f6b54;color:#ffffff;padding:18px 24px;font-size:18px;font-weight:700;">Заявка: заморозка кредитного договора</td></tr>
    <tr><td style="padding:8px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${rows
          .map(
            ([label, value]) => `<tr>
          <td style="padding:10px 24px;font-size:13px;color:#52625b;border-bottom:1px solid #e4ebe6;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:10px 24px;font-size:15px;font-weight:600;border-bottom:1px solid #e4ebe6;white-space:pre-wrap;">${escapeHtml(value)}</td>
        </tr>`
          )
          .join("")}
      </table>
    </td></tr>
  </table>
</body></html>`;

  const telegramText = [
    "❄️ Заявка: заморозка кредитного договора",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
  ].join("\n");

  return { subject, html, telegramText };
}
