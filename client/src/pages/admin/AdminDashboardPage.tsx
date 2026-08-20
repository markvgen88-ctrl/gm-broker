import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ADMIN_STATUS_SUGGESTIONS } from "@/data/adminStatuses";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LastCommentIndicator } from "@/components/admin/LastCommentIndicator";
import { seedCustomStatusesFromUsage } from "@/lib/customStatusStore";
import { fetchApplications } from "@/lib/adminApi";
import type { ApplicationListItem } from "@/lib/adminApi";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Moscow",
});

export function AdminDashboardPage() {
  const [filter, setFilter] = useState<string>("all");
  const [items, setItems] = useState<ApplicationListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Загружаем сразу всё (без фильтра на сервере) — так вкладки фильтров
    // строятся из реальных статусов заявок, а переключение вкладок
    // происходит мгновенно.
    fetchApplications()
      .then((data) => {
        if (!cancelled) {
          setItems(data);
          const defaultLabels = new Set(ADMIN_STATUS_SUGGESTIONS.map((s) => s.label));
          seedCustomStatusesFromUsage(data.map((i) => i.status).filter((s) => !defaultLabels.has(s)));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Не удалось загрузить заявки");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Показываем только те статусы, которые реально встречаются хотя бы в
  // одной заявке — стандартные статусы без единой заявки вкладкой не
  // занимают место.
  const tabs = useMemo(() => {
    if (!items) return [];
    const counts = new Map<string, number>();
    for (const i of items) counts.set(i.status, (counts.get(i.status) ?? 0) + 1);

    const defaultLabels = ADMIN_STATUS_SUGGESTIONS.map((s) => s.label);
    const usedDefaults = defaultLabels.filter((label) => counts.has(label));
    const usedExtra = Array.from(counts.keys()).filter((label) => !defaultLabels.includes(label));

    return [...usedDefaults, ...usedExtra].map((label) => ({ label, count: counts.get(label) ?? 0 }));
  }, [items]);

  const visibleItems = items?.filter((i) => filter === "all" || i.status === filter) ?? null;

  return (
    <div>
      <h1 className="mb-5 font-display text-xl font-semibold sm:mb-6 sm:text-2xl">Заявки</h1>

      <div className="mb-5 flex flex-wrap gap-1.5 sm:mb-6 sm:gap-2">
        <FilterTab active={filter === "all"} onClick={() => setFilter("all")} label="Все" count={items?.length} />
        {tabs.map(({ label, count }) => (
          <FilterTab key={label} active={filter === label} onClick={() => setFilter(label)} label={label} count={count} />
        ))}
      </div>

      {error && <p className="text-rose-400">{error}</p>}

      {!error && visibleItems === null && <p className="text-metal">Загружаем…</p>}

      {visibleItems !== null && visibleItems.length === 0 && (
        <p className="text-metal">Заявок с таким статусом пока нет.</p>
      )}

      {visibleItems !== null && visibleItems.length > 0 && (
        <>
          {/* Десктоп / широкие экраны — таблица */}
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-metal">
                <tr>
                  <th className="px-4 py-3 font-medium">Клиент</th>
                  <th className="px-4 py-3 font-medium">Тип / сумма</th>
                  <th className="px-4 py-3 font-medium">Контакты</th>
                  <th className="px-4 py-3 font-medium">Дата</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">Последний комментарий</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((item) => (
                  <tr key={item.id} className="border-t border-white/5 transition-colors hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <Link to={`/admin/applications/${item.id}`} className="font-medium text-silver hover:text-gold">
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-metal">
                      {item.clientTypeLabel}
                      {item.loanAmount ? ` · ${item.loanAmount}` : ""}
                    </td>
                    <td className="px-4 py-3 text-metal">
                      <div>{item.phone}</div>
                      <div className="text-xs">{item.email}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-metal">
                      {dateFormatter.format(new Date(item.createdAt))}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <LastCommentIndicator comment={item.lastComment} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Мобильный вид — карточки вместо таблицы, чтобы не было горизонтальной прокрутки */}
          <div className="space-y-2.5 sm:hidden">
            {visibleItems.map((item) => (
              <Link
                key={item.id}
                to={`/admin/applications/${item.id}`}
                className="block rounded-xl border border-white/10 bg-white/[0.02] p-3.5 transition-colors active:bg-white/[0.05]"
              >
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <span className="min-w-0 truncate font-medium text-silver">{item.name}</span>
                  <StatusBadge status={item.status} className="shrink-0 text-[11px]" />
                </div>
                <p className="text-xs text-metal">
                  {item.clientTypeLabel}
                  {item.loanAmount ? ` · ${item.loanAmount}` : ""}
                </p>
                <p className="mt-1 truncate text-xs text-metal">
                  {item.phone} · {item.email}
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-metal">
                  <span className="shrink-0">{dateFormatter.format(new Date(item.createdAt))}</span>
                  {item.lastComment && <span className="truncate italic">«{item.lastComment.text}»</span>}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors sm:px-4 sm:py-1.5 sm:text-sm",
        active
          ? "border-gold/60 bg-gold/10 text-gold"
          : "border-white/10 text-metal hover:border-white/25 hover:text-silver"
      )}
    >
      {label}
      {typeof count === "number" && <span className="ml-1.5 opacity-60">{count}</span>}
    </button>
  );
}
