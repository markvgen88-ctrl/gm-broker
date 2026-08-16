import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ADMIN_STATUS_SUGGESTIONS } from "@/data/adminStatuses";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/Button";
import {
  addApplicationComment,
  deleteApplication,
  fetchApplication,
  updateApplicationStatus,
} from "@/lib/adminApi";
import type { ApplicationDetail } from "@/lib/adminApi";

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Moscow",
});

export function AdminApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const applicationId = Number(id);
  const navigate = useNavigate();

  const [item, setItem] = useState<ApplicationDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusInput, setStatusInput] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    fetchApplication(applicationId)
      .then((data) => {
        setItem(data);
        setStatusInput(data.status);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Не удалось загрузить заявку"));
  };

  useEffect(() => {
    setItem(null);
    setError(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const handleStatusSave = async () => {
    if (!item) return;
    const trimmed = statusInput.trim();
    if (!trimmed || trimmed === item.status) return;
    setStatusSaving(true);
    try {
      await updateApplicationStatus(item.id, trimmed);
      setItem({ ...item, status: trimmed });
      setStatusInput(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить статус");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    const sure = window.confirm(`Удалить заявку «${item.name}» без возможности восстановить?`);
    if (!sure) return;
    setDeleting(true);
    try {
      await deleteApplication(item.id);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить заявку");
      setDeleting(false);
    }
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!item || !commentText.trim()) return;
    setCommentSaving(true);
    try {
      const comment = await addApplicationComment(item.id, commentText.trim());
      setItem({ ...item, comments: [...item.comments, comment] });
      setCommentText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось добавить комментарий");
    } finally {
      setCommentSaving(false);
    }
  };

  if (error && !item) {
    return (
      <div>
        <Link to="/admin" className="text-sm text-metal hover:text-gold">
          ← Ко всем заявкам
        </Link>
        <p className="mt-4 text-rose-400">{error}</p>
      </div>
    );
  }

  if (!item) {
    return <p className="text-metal">Загружаем…</p>;
  }

  return (
    <div>
      <Link to="/admin" className="text-sm text-metal hover:text-gold">
        ← Ко всем заявкам
      </Link>

      <div className="mt-4 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">{item.name}</h1>
          <p className="mt-1 text-metal">
            {item.phone} · {item.email}
          </p>
          <p className="mt-1 text-xs text-metal">
            Заявка №{item.id} · {dateTimeFormatter.format(new Date(item.createdAt))}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={item.status} />
          <input
            list="status-suggestions"
            value={statusInput}
            disabled={statusSaving}
            onChange={(e) => setStatusInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStatusSave()}
            placeholder="Свой статус или выберите из списка"
            className="w-56 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-silver outline-none focus:border-gold/60"
          />
          <datalist id="status-suggestions">
            {ADMIN_STATUS_SUGGESTIONS.map((s) => (
              <option key={s.label} value={s.label} />
            ))}
          </datalist>
          <Button
            variant="secondary"
            size="md"
            onClick={handleStatusSave}
            disabled={statusSaving || !statusInput.trim() || statusInput.trim() === item.status}
          >
            {statusSaving ? "…" : "Сохранить"}
          </Button>
        </div>
      </div>

      <div className="mb-6 flex justify-end">
        <Button
          variant="ghost"
          size="md"
          onClick={handleDelete}
          disabled={deleting}
          className="text-rose-400 hover:text-rose-300"
        >
          {deleting ? "Удаляем…" : "Удалить заявку"}
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-rose-400">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-graphite/40 p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">Анкета</h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {item.fields.map((f) => (
              <div key={f.label}>
                <dt className="text-xs text-metal">{f.label}</dt>
                <dd className="text-silver">{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-white/10 bg-graphite/40 p-6">
          <h2 className="mb-4 font-display text-lg font-semibold">Комментарии</h2>

          <div className="mb-4 space-y-3">
            {item.comments.length === 0 && <p className="text-sm text-metal">Пока нет комментариев.</p>}
            {item.comments.map((c) => (
              <div key={c.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-sm whitespace-pre-wrap text-silver">{c.text}</p>
                <p className="mt-1 text-xs text-metal">{dateTimeFormatter.format(new Date(c.createdAt))}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddComment}>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Добавить комментарий…"
              rows={3}
              className="mb-3 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-silver outline-none focus:border-gold/60"
            />
            <Button
              type="submit"
              variant="secondary"
              size="md"
              disabled={commentSaving || !commentText.trim()}
            >
              {commentSaving ? "Сохраняем…" : "Добавить"}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
