import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { StatusEditor } from "@/components/admin/StatusEditor";
import { ContractHistory } from "@/components/admin/ContractHistory";
import { ContractWizardModal } from "@/components/admin/ContractWizardModal";
import { Button } from "@/components/ui/Button";
import {
  addApplicationComment,
  deleteApplication,
  fetchApplication,
  updateApplicationStatus,
} from "@/lib/adminApi";
import type { ApplicationDetail, ContractSummary } from "@/lib/adminApi";

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
  const [statusSaving, setStatusSaving] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [contractWizardOpen, setContractWizardOpen] = useState(false);

  const load = () => {
    fetchApplication(applicationId)
      .then((data) => {
        setItem(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Не удалось загрузить заявку"));
  };

  useEffect(() => {
    setItem(null);
    setError(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const handleStatusChange = async (nextStatus: string) => {
    if (!item) return;
    setStatusSaving(true);
    try {
      await updateApplicationStatus(item.id, nextStatus);
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

  const handleContractCreated = (contract: ContractSummary) => {
    setItem((prev) => (prev ? { ...prev, contracts: [contract, ...prev.contracts] } : prev));
  };

  const handleContractDeleted = (contractId: number) => {
    setItem((prev) => (prev ? { ...prev, contracts: prev.contracts.filter((c) => c.id !== contractId) } : prev));
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

      <div className="mt-4 mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold sm:text-2xl">{item.name}</h1>
          <p className="mt-1 break-words text-sm text-metal sm:text-base">
            {item.phone} · {item.email}
          </p>
          <p className="mt-1 text-xs text-metal">
            Заявка №{item.id} · {dateTimeFormatter.format(new Date(item.createdAt))}
          </p>
        </div>

        <StatusEditor status={item.status} saving={statusSaving} onChange={handleStatusChange} />
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" size="md" onClick={() => setContractWizardOpen(true)}>
          Заполнить договор
        </Button>
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

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-2xl border border-white/10 bg-graphite/40 p-4 sm:p-6">
          <h2 className="mb-3 font-display text-base font-semibold sm:mb-4 sm:text-lg">Анкета</h2>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2 sm:gap-y-3">
            {item.fields.map((f) => (
              <div key={f.label}>
                <dt className="text-xs text-metal">{f.label}</dt>
                <dd className="text-sm text-silver sm:text-base">{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-2xl border border-white/10 bg-graphite/40 p-4 sm:p-6">
          <h2 className="mb-3 font-display text-base font-semibold sm:mb-4 sm:text-lg">Комментарии</h2>

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

        <section className="rounded-2xl border border-white/10 bg-graphite/40 p-4 sm:p-6 lg:col-span-2">
          <h2 className="mb-3 font-display text-base font-semibold sm:mb-4 sm:text-lg">Договоры</h2>
          <ContractHistory contracts={item.contracts} onDeleted={handleContractDeleted} />
        </section>
      </div>

      {contractWizardOpen && (
        <ContractWizardModal
          applicationId={item.id}
          onClose={() => setContractWizardOpen(false)}
          onCreated={handleContractCreated}
        />
      )}
    </div>
  );
}
