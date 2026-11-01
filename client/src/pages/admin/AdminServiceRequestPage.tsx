import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { StatusEditor } from "@/components/admin/StatusEditor";
import { Button } from "@/components/ui/Button";
import {
  addServiceRequestComment,
  deleteServiceRequest,
  fetchServiceRequest,
  updateServiceRequestStatus,
} from "@/lib/adminApi";
import type { ServiceRequestDetail } from "@/lib/adminApi";

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Moscow",
});

const BACK_PATH = "/admin/service-requests";

/** Карточка заявки по услуге: данные клиента, статус, комментарии брокера. */
export function AdminServiceRequestPage() {
  const { id } = useParams<{ id: string }>();
  const requestId = Number(id);
  const navigate = useNavigate();

  const [item, setItem] = useState<ServiceRequestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setItem(null);
    setError(null);
    fetchServiceRequest(requestId)
      .then(setItem)
      .catch((err) => setError(err instanceof Error ? err.message : "Не удалось загрузить заявку"));
  }, [requestId]);

  const handleStatusChange = async (nextStatus: string) => {
    if (!item) return;
    setStatusSaving(true);
    try {
      await updateServiceRequestStatus(item.id, nextStatus);
      setItem({ ...item, status: nextStatus });
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
      await deleteServiceRequest(item.id);
      navigate(BACK_PATH, { replace: true });
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
      const comment = await addServiceRequestComment(item.id, commentText.trim());
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
        <Link to={BACK_PATH} className="text-sm text-metal hover:text-gold">
          ← Ко всем заявкам по услугам
        </Link>
        <p className="mt-4 text-rose-400">{error}</p>
      </div>
    );
  }

  if (!item) {
    return <p className="text-metal">Загружаем…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to={BACK_PATH} className="text-sm text-metal hover:text-gold">
        ← Ко всем заявкам по услугам
      </Link>

      <div className="mt-4 mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold sm:text-2xl">{item.name}</h1>
          <p className="mt-1 break-words text-sm text-metal sm:text-base">
            {item.phone}
            {item.email && ` · ${item.email}`}
            {item.telegram && (
              <>
                {" · "}
                <a
                  href={`https://t.me/${item.telegram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold hover:underline"
                >
                  {item.telegram}
                </a>
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-metal">
            Заявка по услуге №{item.id} · {dateTimeFormatter.format(new Date(item.createdAt))}
          </p>
        </div>

        <StatusEditor status={item.status} saving={statusSaving} onChange={handleStatusChange} />
      </div>

      <div className="mb-5 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="text-rose-400 hover:text-rose-300"
        >
          {deleting ? "Удаляем…" : "Удалить заявку"}
        </Button>
      </div>

      {error && <p className="mb-4 text-sm text-rose-400">{error}</p>}

      <div className="flex flex-col gap-4 sm:gap-5">
        <section className="overflow-hidden rounded-2xl border border-gold/30 bg-black/40 p-4 sm:p-5">
          <p className="text-[11px] font-bold tracking-wider text-gold uppercase">Услуга</p>
          <p className="mt-1.5 text-xl font-extrabold text-silver sm:text-2xl">{item.serviceTitle}</p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-graphite/40 p-4 sm:p-5">
          <h2 className="mb-3 text-[11px] font-bold tracking-wider text-gold uppercase">Комментарий клиента</h2>
          {item.clientComment ? (
            <p className="text-sm whitespace-pre-wrap text-silver">{item.clientComment}</p>
          ) : (
            <p className="text-sm text-metal">Клиент комментарий не оставил.</p>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-graphite/40 p-4 sm:p-5">
          <h2 className="mb-3 text-[11px] font-bold tracking-wider text-gold uppercase">Комментарии</h2>

          <div className="mb-4 space-y-2.5">
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
            <Button type="submit" variant="secondary" size="md" disabled={commentSaving || !commentText.trim()}>
              {commentSaving ? "Сохраняем…" : "Добавить"}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
