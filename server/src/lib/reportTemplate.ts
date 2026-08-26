import { FIELD_LABELS, FIELD_ORDER, formatFieldValue } from "./fields.js";
import type { SubmissionInput } from "./validation.js";

export interface BuiltReport {
  subject: string;
  html: string;
  telegramText: string;
}

const GOLD = "#B98A20";
const GOLD_LIGHT = "#D4AF37";
const INK = "#141414";
const MUTED = "#6b6b6b";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: iso, time: "" };
  return {
    date: new Intl.DateTimeFormat("ru-RU", { dateStyle: "long", timeZone: "Europe/Moscow" }).format(d),
    time: `${new Intl.DateTimeFormat("ru-RU", { timeStyle: "short", timeZone: "Europe/Moscow" }).format(d)} (МСК)`,
  };
}

export function buildReport(input: SubmissionInput): BuiltReport {
  const { answers, clientType, submittedAt } = input;
  const { date, time } = formatDateTime(submittedAt);

  const name = String(answers.name ?? "—");
  const phone = String(answers.phone ?? "—");
  const contactInfo = String(answers.contactInfo ?? "—");
  const loanAmount = answers.loanAmount !== undefined ? formatFieldValue("loanAmount", answers.loanAmount) : "—";
  const loanPurpose = answers.loanPurpose !== undefined ? String(answers.loanPurpose) : "—";
  const clientTypeLabel = formatFieldValue("clientType", clientType);

  const rows = FIELD_ORDER.filter((key) => answers[key] !== undefined && answers[key] !== "")
    .map((key) => ({ label: FIELD_LABELS[key] ?? key, value: formatFieldValue(key, answers[key]) }));

  // ---------------- HTML (для e-mail) ----------------
  const rowsHtml = rows
    .map(
      (r, i) => `
        <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f7f5f0"};">
          <td style="padding:10px 16px;font-size:13px;color:${MUTED};border-bottom:1px solid #ece7da;white-space:nowrap;">${escapeHtml(r.label)}</td>
          <td style="padding:10px 16px;font-size:14px;color:${INK};font-weight:600;border-bottom:1px solid #ece7da;">${escapeHtml(r.value)}</td>
        </tr>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="ru">
  <body style="margin:0;padding:0;background:#efece3;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efece3;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4ded0;">
            <tr>
              <td style="background:linear-gradient(135deg,${INK},#000);padding:28px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-family:Arial,sans-serif;font-size:20px;font-weight:bold;color:#ffffff;letter-spacing:0.5px;">
                      G.M. <span style="color:${GOLD_LIGHT};">Broker</span>
                    </td>
                    <td align="right" style="font-family:Arial,sans-serif;font-size:12px;color:#c9c9c9;">
                      Новая заявка с сайта
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:28px 32px 8px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:13px;color:${MUTED};padding-bottom:4px;">Дата</td>
                    <td align="right" style="font-size:13px;color:${MUTED};padding-bottom:4px;">Время</td>
                  </tr>
                  <tr>
                    <td style="font-size:15px;color:${INK};font-weight:600;">${escapeHtml(date)}</td>
                    <td align="right" style="font-size:15px;color:${INK};font-weight:600;">${escapeHtml(time)}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 32px 0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7ef;border:1px solid #ecdfb8;border-radius:12px;">
                  <tr>
                    <td style="padding:18px 22px;">
                      <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${GOLD};font-weight:bold;margin-bottom:10px;">
                        Клиент
                      </div>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="font-size:13px;color:${MUTED};padding-bottom:6px;width:40%;">Тип клиента</td>
                          <td style="font-size:14px;color:${INK};font-weight:700;padding-bottom:6px;">${escapeHtml(clientTypeLabel)}</td>
                        </tr>
                        <tr>
                          <td style="font-size:13px;color:${MUTED};padding-bottom:6px;">Имя</td>
                          <td style="font-size:14px;color:${INK};font-weight:700;padding-bottom:6px;">${escapeHtml(name)}</td>
                        </tr>
                        <tr>
                          <td style="font-size:13px;color:${MUTED};padding-bottom:6px;">Телефон</td>
                          <td style="font-size:14px;color:${INK};font-weight:700;padding-bottom:6px;">
                            <a href="tel:${escapeHtml(phone.replace(/[^\d+]/g, ""))}" style="color:${INK};text-decoration:none;">${escapeHtml(phone)}</a>
                          </td>
                        </tr>
                        <tr>
                          <td style="font-size:13px;color:${MUTED};">E-mail</td>
                          <td style="font-size:14px;color:${INK};font-weight:700;">
                            <a href="mailto:${escapeHtml(contactInfo)}" style="color:${INK};text-decoration:none;">${escapeHtml(contactInfo)}</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 32px 0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${INK};border-radius:12px;">
                  <tr>
                    <td width="50%" style="padding:18px 22px;border-right:1px solid rgba(255,255,255,0.1);">
                      <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${GOLD_LIGHT};font-weight:bold;margin-bottom:6px;">
                        Нужная сумма
                      </div>
                      <div style="font-size:20px;color:#ffffff;font-weight:800;">${escapeHtml(loanAmount)}</div>
                    </td>
                    <td width="50%" style="padding:18px 22px;">
                      <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${GOLD_LIGHT};font-weight:bold;margin-bottom:6px;">
                        Цель кредитования
                      </div>
                      <div style="font-size:14px;color:#ffffff;font-weight:600;">${escapeHtml(loanPurpose)}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:24px 32px 8px 32px;">
                <div style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${GOLD};font-weight:bold;">
                  Полная анкета
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ece7da;border-radius:10px;overflow:hidden;">
                  ${rowsHtml}
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 32px;background:#faf7ef;border-top:1px solid #ece7da;">
                <p style="margin:0;font-size:11px;color:${MUTED};line-height:1.6;">
                  Автоматическое уведомление с сайта G.M. Broker. Анкета сформирована по ответам клиента и предназначена
                  для внутреннего анализа перспектив кредитования.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  // ---------------- Telegram (HTML parse_mode) ----------------
  const telegramRows = rows.map((r) => `• <b>${escapeHtml(r.label)}:</b> ${escapeHtml(r.value)}`).join("\n");

  const telegramText = [
    `🔔 <b>Новая заявка — ${escapeHtml(clientTypeLabel)} — ${escapeHtml(name)}</b>`,
    "",
    `📅 ${escapeHtml(date)}, ${escapeHtml(time)}`,
    `👤 <b>Тип клиента:</b> ${escapeHtml(clientTypeLabel)}`,
    `🙋 <b>Имя:</b> ${escapeHtml(name)}`,
    `📞 <b>Телефон:</b> ${escapeHtml(phone)}`,
    `📧 <b>E-mail:</b> ${escapeHtml(contactInfo)}`,
    "",
    `💰 <b>Сумма:</b> ${escapeHtml(loanAmount)}`,
    `🎯 <b>Цель:</b> ${escapeHtml(loanPurpose)}`,
    "",
    "<b>Полная анкета:</b>",
    telegramRows,
  ].join("\n");

  return {
    subject: `Новая заявка — ${clientTypeLabel} — ${name}`,
    html,
    telegramText,
  };
}
