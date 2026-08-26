import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { deleteContract, downloadContract } from "@/lib/adminApi";
import type { ContractSummary } from "@/lib/adminApi";

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Moscow",
});

interface ContractHistoryProps {
  contracts: ContractSummary[];
  onDeleted: (id: number) => void;
}

export function ContractHistory({ contracts, onDeleted }: ContractHistoryProps) {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (contracts.length === 0) {
    return <p className="text-sm text-metal">Договоры по этой заявке ещё не создавались.</p>;
  }

  const handleDownload = async (id: number) => {
    setDownloadingId(id);
    setError(null);
    try {
      await downloadContract(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось скачать договор");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (c: ContractSummary) => {
    const sure = window.confirm(`Удалить договор №${c.contractNum} без возможности восстановить?`);
    if (!sure) return;
    setDeletingId(c.id);
    setError(null);
    try {
      await deleteContract(c.id);
      onDeleted(c.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить договор");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-rose-400">{error}</p>}
      {contracts.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 p-3"
        >
          <div>
            <p className="text-sm text-silver">
              Договор №{c.contractNum} · {c.clientType}
            </p>
            <p className="text-xs text-metal">
              {c.clientName} · {dateTimeFormatter.format(new Date(c.createdAt))}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => handleDownload(c.id)}
              disabled={downloadingId === c.id || deletingId === c.id}
              className="text-sm text-metal hover:text-gold disabled:opacity-50"
            >
              {downloadingId === c.id ? "Скачиваем…" : "Скачать"}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(c)}
              disabled={deletingId === c.id || downloadingId === c.id}
              aria-label="Удалить договор"
              title="Удалить договор"
              className="text-metal hover:text-rose-400 disabled:opacity-50"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
