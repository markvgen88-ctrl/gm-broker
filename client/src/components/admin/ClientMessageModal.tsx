import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { fetchEmailTemplates, sendApplicationMessage } from "@/lib/adminApi";
import type { ApplicationMessage, ContractSummary, EmailTemplate } from "@/lib/adminApi";
import { fillTemplate } from "@/data/emailTemplates";

const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = ["pdf", "doc", "docx", "xls", "xlsx", "odt", "ods", "rtf", "txt", "csv", "jpg", "jpeg", "png", "gif", "webp", "heic", "zip", "rar", "7z"];

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} МБ` : `${Math.max(1, Math.round(bytes / 1024))} КБ`;

const fileExt = (name: string) => (name.includes(".") ? name.split(".").pop()!.toLowerCase() : "");

const isPlausibleEmail = (v: string) => /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]{2,}$/.test(v.trim());

interface ClientMessageModalProps {
  applicationId: number;
  clientName: string;
  clientEmail: string;
  contracts: ContractSummary[];
  onClose: () => void;
  /** message === null — письмо ушло, но в историю не записалось. */
  onSent: (message: ApplicationMessage | null) => void;
}

/** Окно «Написать клиенту»: тема, текст (можно взять шаблон), вложения и договоры из истории заявки. */
export function ClientMessageModal({
  applicationId,
  clientName,
  clientEmail,
  contracts,
  onClose,
  onSent,
}: ClientMessageModalProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [signature, setSignature] = useState("");
  const [templatesFailed, setTemplatesFailed] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [bodyEdited, setBodyEdited] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [contractIds, setContractIds] = useState<number[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Шаблоны и подпись редактируются в отдельной вкладке («Шаблоны писем»), поэтому
  // перечитываем их при возврате в это окно, чтобы правки были видны сразу.
  const loadTemplates = useCallback(async () => {
    try {
      const data = await fetchEmailTemplates();
      setTemplates(data.templates);
      setSignature(data.signature);
      setTemplatesFailed(false);
    } catch {
      setTemplatesFailed(true);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
    window.addEventListener("focus", loadTemplates);
    return () => window.removeEventListener("focus", loadTemplates);
  }, [loadTemplates]);

  const emailOk = isPlausibleEmail(clientEmail);
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const canSend = emailOk && subject.trim() !== "" && body.trim() !== "" && !sending;

  const handleTemplate = (id: string) => {
    if (id !== "" && bodyEdited && !window.confirm("Заменить уже написанный текст шаблоном?")) return;
    setTemplateId(id);
    const tpl = templates.find((t) => String(t.id) === id);
    if (!tpl) return;
    const text = fillTemplate(tpl.body, clientName).trimEnd();
    setSubject(fillTemplate(tpl.subject, clientName));
    setBody(signature ? `${text}\n\n${signature}` : text);
    setBodyEdited(false);
  };

  const handleInsertSignature = () => {
    if (!signature) return;
    setBody((prev) => (prev.trim() === "" ? signature : `${prev.trimEnd()}\n\n${signature}`));
    setBodyEdited(true);
  };

  const handlePickFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;

    let next = [...files];
    for (const file of picked) {
      if (!ALLOWED_EXT.includes(fileExt(file.name))) {
        setError(`Файл «${file.name}» не подходит: допустимы документы, таблицы, картинки и архивы`);
        return;
      }
      if (next.some((f) => f.name === file.name && f.size === file.size)) continue;
      next.push(file);
    }
    if (next.length > MAX_FILES) {
      setError(`Можно прикрепить не больше ${MAX_FILES} файлов`);
      return;
    }
    if (next.reduce((sum, f) => sum + f.size, 0) > MAX_TOTAL_BYTES) {
      setError("Вложения весят больше 10 МБ: уберите часть файлов");
      return;
    }
    setError(null);
    setFiles(next);
  };

  const toggleContract = (id: number) =>
    setContractIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      const message = await sendApplicationMessage(applicationId, {
        subject: subject.trim(),
        body: body.trim(),
        files,
        contractIds,
      });
      onSent(message);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить письмо");
      setSending(false);
    }
  };

  const handleClose = () => {
    if (sending) return;
    const hasDraft = body.trim() !== "" || files.length > 0;
    if (hasDraft && !window.confirm("Закрыть окно? Текст письма не сохранится.")) return;
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center">
      <div className="my-4 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#141414] p-5 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="font-display text-lg font-semibold text-silver">Написать клиенту</h2>
          <button type="button" onClick={handleClose} className="text-metal hover:text-gold" aria-label="Закрыть">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-1 text-xs text-metal">Кому</p>
            <p className={`text-sm font-semibold ${emailOk ? "text-silver" : "text-rose-400"}`}>
              {emailOk ? `${clientName} <${clientEmail.trim()}>` : "В заявке нет корректного e-mail, написать не получится"}
            </p>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-3">
              <label htmlFor="msg-template" className="block text-xs text-metal">
                Шаблон (необязательно)
              </label>
              <a
                href="/admin/email-templates"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-gold underline-offset-4 hover:underline"
              >
                Редактировать шаблоны
              </a>
            </div>
            <select
              id="msg-template"
              value={templateId}
              onChange={(e) => handleTemplate(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-silver outline-none focus:border-gold/60"
            >
              <option value="">Без шаблона</option>
              {templates.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.label}
                </option>
              ))}
            </select>
            {templatesFailed && (
              <p className="mt-1 text-xs text-rose-400">Не удалось загрузить шаблоны, текст можно написать вручную.</p>
            )}
          </div>

          <div>
            <label htmlFor="msg-subject" className="mb-1 block text-xs text-metal">
              Тема
            </label>
            <input
              id="msg-subject"
              type="text"
              value={subject}
              maxLength={200}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-silver outline-none focus:border-gold/60"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-3">
              <label htmlFor="msg-body" className="block text-xs text-metal">
                Текст письма
              </label>
              {signature && !body.includes(signature) && (
                <button
                  type="button"
                  onClick={handleInsertSignature}
                  className="text-xs text-gold underline-offset-4 hover:underline"
                >
                  Вставить подпись
                </button>
              )}
            </div>
            <textarea
              id="msg-body"
              value={body}
              rows={10}
              onChange={(e) => {
                setBody(e.target.value);
                setBodyEdited(true);
              }}
              className="w-full resize-y rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm leading-relaxed text-silver outline-none focus:border-gold/60"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || files.length >= MAX_FILES}
              >
                Прикрепить файл
              </Button>
              <span className="text-xs text-metal">
                до {MAX_FILES} файлов, всего до 10 МБ{files.length > 0 ? ` · сейчас ${formatSize(totalBytes)}` : ""}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept={ALLOWED_EXT.map((e) => `.${e}`).join(",")}
                onChange={handlePickFiles}
              />
            </div>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {files.map((f) => (
                  <li
                    key={`${f.name}-${f.size}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                  >
                    <span className="min-w-0 truncate text-sm text-silver">
                      {f.name} <span className="text-xs text-metal">· {formatSize(f.size)}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((x) => x !== f))}
                      disabled={sending}
                      className="shrink-0 text-metal hover:text-rose-400 disabled:opacity-50"
                      aria-label={`Убрать файл ${f.name}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {contracts.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs text-metal">Приложить договор из истории заявки</p>
              <ul className="space-y-1.5">
                {contracts.map((c) => (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-silver">
                      <input
                        type="checkbox"
                        checked={contractIds.includes(c.id)}
                        onChange={() => toggleContract(c.id)}
                        disabled={sending}
                        className="h-4 w-4 accent-[#d4af37]"
                      />
                      <span>
                        Договор №{c.contractNum} · {c.clientName}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <p className="text-xs leading-relaxed text-metal">
            Письмо уйдёт с почты сайта. Копия придёт вам скрытой копией, а ответ клиента попадёт в вашу рабочую почту,
            в CRM он не отобразится.
          </p>

          <div className="flex items-center justify-between gap-3 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={handleClose} disabled={sending}>
              Отмена
            </Button>
            <Button type="button" variant="primary" size="md" onClick={handleSend} disabled={!canSend}>
              {sending ? "Отправляем…" : "Отправить"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
