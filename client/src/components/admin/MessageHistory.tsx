import type { ApplicationMessage } from "@/lib/adminApi";

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Moscow",
});

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(bytes / 1024))} КБ`;

/** История писем клиенту, отправленных из CRM. Текст раскрывается по клику. */
export function MessageHistory({ messages }: { messages: ApplicationMessage[] }) {
  if (messages.length === 0) {
    return <p className="text-sm text-metal">Писем клиенту из CRM пока не было.</p>;
  }

  return (
    <div className="space-y-2.5">
      {messages.map((m) => (
        <details key={m.id} className="group rounded-lg border border-white/10 bg-black/20 p-3">
          <summary className="cursor-pointer list-none">
            <p className="text-sm font-semibold text-silver group-open:text-gold">{m.subject}</p>
            <p className="mt-0.5 text-xs text-metal">
              {dateTimeFormatter.format(new Date(m.createdAt))} · {m.toEmail}
              {m.attachments.length > 0 ? ` · вложений: ${m.attachments.length}` : ""}
            </p>
          </summary>
          <p className="mt-3 text-sm whitespace-pre-wrap text-silver">{m.body}</p>
          {m.attachments.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-white/10 pt-2.5">
              {m.attachments.map((a, i) => (
                <li key={`${a.name}-${i}`} className="text-xs text-metal">
                  📎 {a.name} · {formatSize(a.size)}
                </li>
              ))}
            </ul>
          )}
        </details>
      ))}
    </div>
  );
}
