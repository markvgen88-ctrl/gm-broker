import { useState } from "react";
import { downloadContract } from "@/lib/adminApi";
import type { ContractSummary } from "@/lib/adminApi";

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Moscow",
});

export function ContractHistory({ contracts }: { contracts: ContractSummary[] }) {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
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
          <button
            type="button"
            onClick={() => handleDownload(c.id)}
            disabled={downloadingId === c.id}
            className="shrink-0 text-sm text-metal hover:text-gold disabled:opacity-50"
          >
            {downloadingId === c.id ? "Скачиваем…" : "Скачать"}
          </button>
        </div>
      ))}
    </div>
  );
}
