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

/** Подсветка строк анкеты: зелёный — плюс, красный — минус. */
const TONE_STYLES = {
  good: { row: "border-l-emerald-400 bg-emerald-500/10", value: "text-emerald-300" },
  bad: { row: "border-l-rose-400 bg-rose-500/10", value: "text-rose-300" },
  neutral: { row: "border-l-transparent odd:bg-white/[0.02]", value: "text-silver" },
} as const;

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

  const loanAmountField = item.fields.find((f) => f.key === "loanAmount");
  const loanPurposeField = item.fields.find((f) => f.key === "loanPurpose");

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/admin" className="text-sm text-metal hover:text-gold">
        ← Ко всем заявкам
      </Link>

      <div className="mt-4 mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-semibold sm:text-2xl">{item.name}</h1>
          <p className="mt-1 break-words text-sm text-metal sm:text-base">
            {item.phone} · {item.email}
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
            Заявка №{item.id} · {dateTimeFormatter.format(new Date(item.createdAt))}
          </p>
        </div>

        <StatusEditor status={item.status} saving={statusSaving} onChange={handleStatusChange} />
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button variant="secondary" size="sm" onClick={() => setContractWizardOpen(true)}>
          Заполнить договор
        </Button>
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
        {(loanAmountField || loanPurposeField) && (
          <section className="grid grid-cols-1 overflow-hidden rounded-2xl border border-gold/30 bg-black/40 sm:grid-cols-2">
            <div className="p-4 sm:p-5">
              <p className="text-[11px] font-bold tracking-wider text-gold uppercase">Нужная сумма</p>
              <p className="mt-1.5 text-xl font-extrabold text-silver sm:text-2xl">{loanAmountField?.value ?? "—"}</p>
            </div>
            <div className="border-t border-white/10 p-4 sm:border-t-0 sm:border-l sm:p-5">
              <p className="text-[11px] font-bold tracking-wider text-gold uppercase">Цель кредитования</p>
              <p className="mt-1.5 text-sm font-semibold text-silver sm:text-base">{loanPurposeField?.value ?? "—"}</p>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-white/10 bg-graphite/40 p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
            <h2 className="text-[11px] font-bold tracking-wider text-gold uppercase">Полная анкета</h2>
            <div className="flex items-center gap-3 text-[11px] text-metal">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> плюс
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" /> минус
              </span>
            </div>
          </div>

          <dl className="overflow-hidden rounded-xl border border-white/10">
            {item.fields.map((f) => {
              const tone = TONE_STYLES[f.tone];
              return (
                <div
                  key={f.key}
                  className={`flex flex-col gap-0.5 border-b border-l-4 border-b-white/5 px-3 py-2.5 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 sm:px-4 ${tone.row}`}
                >
                  <dt className="text-xs text-metal sm:text-[13px]">{f.label}</dt>
                  <dd className={`text-sm font-semibold break-words sm:text-right sm:text-[15px] ${tone.value}`}>
                    {f.value}
                  </dd>
                </div>
              );
            })}
          </dl>
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

        <section className="rounded-2xl border border-white/10 bg-graphite/40 p-4 sm:p-5">
          <h2 className="mb-3 text-[11px] font-bold tracking-wider text-gold uppercase">Договоры</h2>
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
