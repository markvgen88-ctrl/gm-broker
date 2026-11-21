import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { fetchApplicationComparison } from "@/lib/adminApi";
import type { ApplicationComparison, ComparisonCell } from "@/lib/adminApi";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Moscow",
});

/** Подсветка ответов: зелёный — плюс, красный — минус (как в карточке заявки). */
const TONE_STYLES = {
  good: "border-l-emerald-400 bg-emerald-500/10 text-emerald-300",
  bad: "border-l-rose-400 bg-rose-500/10 text-rose-300",
  neutral: "border-l-transparent bg-white/[0.02] text-silver",
} as const;

const LABEL_COL = "200px";
const DATA_COL = "minmax(190px, 1fr)";

/** Как изменился ответ по сравнению с предыдущей заявкой клиента. */
function describeChange(prev: ComparisonCell | null, cur: ComparisonCell | null): string | null {
  const p = prev?.value ?? null;
  const c = cur?.value ?? null;
  if (p === c) return null;
  if (p === null) return "новый ответ";
  if (c === null) return `раньше: ${p} · сейчас вопроса нет`;
  return `было: ${p}`;
}

export function AdminApplicationComparePage() {
  const { id } = useParams<{ id: string }>();
  const applicationId = Number(id);

  const [data, setData] = useState<ApplicationComparison | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [onlyChanges, setOnlyChanges] = useState(true);

  useEffect(() => {
    setData(null);
    setError(null);
    fetchApplicationComparison(applicationId)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Не удалось загрузить сравнение"));
  }, [applicationId]);

  const changedCount = useMemo(() => data?.rows.filter((r) => r.changed).length ?? 0, [data]);

  const backLink = (
    <Link to={`/admin/applications/${applicationId}`} className="text-sm text-metal hover:text-gold">
      ← Назад к заявке
    </Link>
  );

  if (error) {
    return (
      <div>
        {backLink}
        <p className="mt-4 text-rose-400">{error}</p>
      </div>
    );
  }
  if (!data) return <p className="text-metal">Загружаем…</p>;

  const { columns, rows } = data;
  const n = columns.length;
  const visibleRows = onlyChanges ? rows.filter((r) => r.changed) : rows;
  const template = `${LABEL_COL} repeat(${n}, ${DATA_COL})`;
  const gridStyle = { "--tpl": template } as CSSProperties;
  const gridClass = "grid grid-cols-1 sm:[grid-template-columns:var(--tpl)]";

  return (
    <div className="mx-auto max-w-6xl">
      {backLink}

      <div className="mt-4 mb-5">
        <h1 className="font-display text-xl font-semibold sm:text-2xl">Сравнение заявок — {data.clientName}</h1>
        <p className="mt-1 text-sm text-metal">
          Ответы клиента от самой старой заявки к самой новой. Заявок: {n}.
        </p>
      </div>

      {n < 2 ? (
        <p className="rounded-2xl border border-white/10 bg-graphite/40 p-5 text-sm text-metal">
          У этого клиента пока нет повторных заявок — сравнивать не с чем.
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="text-sm text-silver">
              Изменилось ответов: <span className="font-semibold text-amber-300">{changedCount}</span> из {rows.length}
            </p>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-silver select-none">
              <input
                type="checkbox"
                checked={onlyChanges}
                onChange={(e) => setOnlyChanges(e.target.checked)}
                className="h-4 w-4 accent-amber-400"
              />
              Только изменившиеся
            </label>
          </div>

          {/* Список заявок на телефоне (на компьютере то же самое — в шапке колонок) */}
          <ol className="mb-4 space-y-2 sm:hidden">
            {columns.map((c, i) => (
              <li key={c.id}>
                <Link
                  to={`/admin/applications/${c.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
                >
                  <span className="text-sm text-silver">
                    <span className="font-semibold">
                      {i + 1}. №{c.id}
                    </span>
                    <span className="block text-xs text-metal">{dateFormatter.format(new Date(c.createdAt))} МСК</span>
                  </span>
                  <StatusBadge status={c.status} className="text-[11px]" />
                </Link>
              </li>
            ))}
          </ol>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-graphite/40">
            <div className="sm:min-w-fit">
              {/* Шапка колонок — только на компьютере */}
              <div className={cn(gridClass, "hidden border-b border-white/10 bg-black/30 sm:grid")} style={gridStyle}>
                <div className="p-3 text-[11px] font-bold tracking-wider text-gold uppercase">Вопрос</div>
                {columns.map((c, i) => (
                  <Link
                    key={c.id}
                    to={`/admin/applications/${c.id}`}
                    className={cn(
                      "block border-l border-white/10 p-3 transition-colors hover:bg-white/[0.04]",
                      c.id === data.currentId && "bg-amber-500/[0.07]"
                    )}
                  >
                    <span className="block text-[11px] font-bold tracking-wider text-gold uppercase">
                      {i === 0 ? "Первая" : `${i + 1}-я`} · №{c.id}
                    </span>
                    <span className="mt-0.5 block text-xs text-metal">{dateFormatter.format(new Date(c.createdAt))} МСК</span>
                    <span className="mt-0.5 block text-xs text-metal">
                      {c.clientTypeLabel}
                      {c.loanAmount ? ` · ${c.loanAmount}` : ""}
                    </span>
                    <StatusBadge status={c.status} className="mt-1.5 text-[11px]" />
                  </Link>
                ))}
              </div>

              {visibleRows.length === 0 && (
                <p className="p-5 text-sm text-metal">Ответы во всех заявках совпадают — изменений нет.</p>
              )}

              {visibleRows.map((row) => (
                <div
                  key={row.key}
                  className={cn(gridClass, "border-b border-white/5 last:border-b-0")}
                  style={gridStyle}
                >
                  <div
                    className={cn(
                      "border-l-4 px-3 pt-3 pb-1 text-xs font-medium text-metal sm:py-3 sm:text-[13px]",
                      row.changed ? "border-l-amber-400 text-silver" : "border-l-transparent"
                    )}
                  >
                    {row.label}
                    {row.changed && (
                      <span className="ml-2 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                        изменилось
                      </span>
                    )}
                  </div>

                  {row.cells.map((cell, i) => {
                    const change = i > 0 ? describeChange(row.cells[i - 1], cell) : null;
                    const col = columns[i];
                    return (
                      <div
                        key={col.id}
                        className={cn(
                          "border-l-4 px-3 py-2 sm:border-l sm:border-l-white/10 sm:py-3",
                          cell ? TONE_STYLES[cell.tone] : "border-l-transparent text-metal/60"
                        )}
                      >
                        <span className="block text-[11px] text-metal sm:hidden">
                          {i + 1}-я · {dateFormatter.format(new Date(col.createdAt))}
                        </span>
                        <span className="block text-sm font-semibold break-words">{cell ? cell.value : "—"}</span>
                        {change && <span className="mt-0.5 block text-[11px] font-normal text-amber-300/90">{change}</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
