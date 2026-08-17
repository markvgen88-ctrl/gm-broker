import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ADMIN_STATUS_SUGGESTIONS } from "@/data/adminStatuses";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LastCommentIndicator } from "@/components/admin/LastCommentIndicator";
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
    // могут включать и статусы по умолчанию, и любые свои, которые реально
    // встречаются в заявках, а переключение вкладок происходит мгновенно.
    fetchApplications()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Не удалось загрузить заявки");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tabs = useMemo(() => {
    const defaults = ADMIN_STATUS_SUGGESTIONS.map((s) => s.label);
    const extra = Array.from(new Set((items ?? []).map((i) => i.status))).filter((s) => !defaults.includes(s));
    return [...defaults, ...extra];
  }, [items]);

  const visibleItems = items?.filter((i) => filter === "all" || i.status === filter) ?? null;

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-semibold">Заявки</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        <FilterTab active={filter === "all"} onClick={() => setFilter("all")} label="Все" />
        {tabs.map((label) => (
          <FilterTab key={label} active={filter === label} onClick={() => setFilter(label)} label={label} />
        ))}
      </div>

      {error && <p className="text-rose-400">{error}</p>}

      {!error && visibleItems === null && <p className="text-metal">Загружаем…</p>}

      {visibleItems !== null && visibleItems.length === 0 && (
        <p className="text-metal">Заявок с таким статусом пока нет.</p>
      )}

      {visibleItems !== null && visibleItems.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-white/10">
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
                <tr
                  key={item.id}
                  className="border-t border-white/5 transition-colors hover:bg-white/[0.03]"
                >
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
      )}
    </div>
  );
}

function FilterTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm transition-colors",
        active
          ? "border-gold/60 bg-gold/10 text-gold"
          : "border-white/10 text-metal hover:border-white/25 hover:text-silver"
      )}
    >
      {label}
    </button>
  );
}
