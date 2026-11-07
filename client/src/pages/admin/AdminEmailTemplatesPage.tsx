import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  createEmailTemplate,
  deleteEmailTemplate,
  fetchEmailTemplates,
  saveEmailSignature,
  updateEmailTemplate,
} from "@/lib/adminApi";
import type { EmailTemplate } from "@/lib/adminApi";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-silver outline-none focus:border-gold/60";
const sectionClass = "rounded-2xl border border-white/10 bg-graphite/40 p-4 sm:p-5";
const headingClass = "mb-3 text-[11px] font-bold tracking-wider text-gold uppercase";

/**
 * Шаблоны писем клиенту и подпись. Используются в окне «Написать клиенту» в
 * карточке заявки: выбранный шаблон подставляется в письмо, к нему добавляется
 * подпись. В тексте и теме можно писать {name} — вместо этого подставится имя
 * клиента из заявки.
 */
export function AdminEmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[] | null>(null);
  const [signature, setSignature] = useState("");
  const [savedSignature, setSavedSignature] = useState("");
  const [signatureNote, setSignatureNote] = useState<string | null>(null);
  const [savingSignature, setSavingSignature] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchEmailTemplates()
      .then((data) => {
        if (cancelled) return;
        setTemplates(data.templates);
        setSignature(data.signature);
        setSavedSignature(data.signature);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Не удалось загрузить шаблоны");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveSignature = async () => {
    setSavingSignature(true);
    setSignatureNote(null);
    try {
      const saved = await saveEmailSignature(signature);
      setSignature(saved);
      setSavedSignature(saved);
      setSignatureNote("Подпись сохранена.");
    } catch (err) {
      setSignatureNote(err instanceof Error ? err.message : "Не удалось сохранить подпись");
    } finally {
      setSavingSignature(false);
    }
  };

  if (error) return <p className="text-sm text-rose-400">{error}</p>;
  if (templates === null) return <p className="text-metal">Загружаем шаблоны…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-silver sm:text-2xl">Шаблоны писем</h1>
        <p className="mt-2 text-sm leading-relaxed text-metal">
          Эти шаблоны доступны в окне «Написать клиенту» в карточке заявки. Пишите{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-silver">{"{name}"}</code> там, где нужно имя клиента:
          из заявки подставится оно. Подпись добавляется в конец письма при выборе шаблона, поэтому в самих шаблонах
          её писать не нужно.
        </p>
      </div>

      <section className={sectionClass}>
        <h2 className={headingClass}>Подпись</h2>
        <textarea
          value={signature}
          rows={9}
          onChange={(e) => {
            setSignature(e.target.value);
            setSignatureNote(null);
          }}
          className={`${inputClass} resize-y leading-relaxed`}
          aria-label="Подпись письма"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveSignature}
            disabled={savingSignature || signature.trim() === savedSignature.trim()}
          >
            {savingSignature ? "Сохраняем…" : "Сохранить подпись"}
          </Button>
          {signatureNote && <span className="text-sm text-metal">{signatureNote}</span>}
        </div>
        <p className="mt-2 text-xs text-metal">Ссылки в подписи в письме становятся кликабельными.</p>
      </section>

      <section className={sectionClass}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[11px] font-bold tracking-wider text-gold uppercase">Шаблоны ({templates.length})</h2>
          {!adding && (
            <Button variant="secondary" size="sm" onClick={() => setAdding(true)}>
              Добавить шаблон
            </Button>
          )}
        </div>

        <div className="space-y-2.5">
          {adding && (
            <TemplateCard
              isNew
              template={{ id: 0, label: "", subject: "", body: "" }}
              onCancelNew={() => setAdding(false)}
              onSaved={(t) => {
                setTemplates((prev) => (prev ? [...prev, t] : [t]));
                setAdding(false);
              }}
            />
          )}
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onSaved={(saved) => setTemplates((prev) => prev && prev.map((x) => (x.id === saved.id ? saved : x)))}
              onDeleted={() => setTemplates((prev) => prev && prev.filter((x) => x.id !== t.id))}
            />
          ))}
          {templates.length === 0 && !adding && (
            <p className="text-sm text-metal">Шаблонов пока нет. Нажмите «Добавить шаблон».</p>
          )}
        </div>
      </section>
    </div>
  );
}

function TemplateCard({
  template,
  isNew = false,
  onSaved,
  onDeleted,
  onCancelNew,
}: {
  template: EmailTemplate;
  isNew?: boolean;
  onSaved: (template: EmailTemplate) => void;
  onDeleted?: () => void;
  onCancelNew?: () => void;
}) {
  const [label, setLabel] = useState(template.label);
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dirty = isNew || label !== template.label || subject !== template.subject || body !== template.body;
  const valid = label.trim() !== "" && subject.trim() !== "";

  const handleSave = async () => {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const payload = { label: label.trim(), subject: subject.trim(), body };
      const saved = isNew ? await createEmailTemplate(payload) : await updateEmailTemplate(template.id, payload);
      if (!isNew) {
        setLabel(saved.label);
        setSubject(saved.subject);
        setBody(saved.body);
        setNote("Сохранено.");
      }
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить шаблон");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Удалить шаблон «${template.label}»?`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteEmailTemplate(template.id);
      onDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить шаблон");
      setBusy(false);
    }
  };

  return (
    <details open={isNew} className="group rounded-lg border border-white/10 bg-black/20 p-3">
      <summary className="cursor-pointer list-none">
        <p className="text-sm font-semibold text-silver group-open:text-gold">
          {isNew ? "Новый шаблон" : template.label}
        </p>
        {!isNew && <p className="mt-0.5 truncate text-xs text-metal">{template.subject}</p>}
      </summary>

      <div className="mt-3 space-y-3">
        <div>
          <label className="mb-1 block text-xs text-metal">Название в списке</label>
          <input
            type="text"
            value={label}
            maxLength={100}
            onChange={(e) => setLabel(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-metal">Тема письма</label>
          <input
            type="text"
            value={subject}
            maxLength={200}
            onChange={(e) => setSubject(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-metal">Текст (без подписи)</label>
          <textarea
            value={body}
            rows={10}
            onChange={(e) => setBody(e.target.value)}
            className={`${inputClass} resize-y leading-relaxed`}
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}
        {note && !dirty && <p className="text-sm text-emerald-300">{note}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" onClick={handleSave} disabled={busy || !dirty || !valid}>
              {busy ? "Сохраняем…" : isNew ? "Создать шаблон" : "Сохранить"}
            </Button>
            {isNew && (
              <Button variant="ghost" size="sm" onClick={onCancelNew} disabled={busy}>
                Отмена
              </Button>
            )}
          </div>
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="text-xs text-metal hover:text-rose-400 disabled:opacity-50"
            >
              Удалить шаблон
            </button>
          )}
        </div>
      </div>
    </details>
  );
}
