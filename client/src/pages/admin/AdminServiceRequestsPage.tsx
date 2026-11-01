import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ADMIN_STATUS_SUGGESTIONS } from "@/data/adminStatuses";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { LastCommentIndicator } from "@/components/admin/LastCommentIndicator";
import { seedCustomStatusesFromUsage } from "@/lib/customStatusStore";
import { fetchServiceRequests } from "@/lib/adminApi";
import type { ServiceRequestListItem } from "@/lib/adminApi";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Moscow",
});

/**
 * Заявки по услугам (заморозка, банкротство, реструктуризация и т. д.) —
 * отдельно от анкет на кредитование. Фильтры: по услуге и по статусу.
 */
export function AdminServiceRequestsPage() {
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [items, setItems] = useState<ServiceRequestListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchServiceRequests()
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

  // Вкладки услуг — только те, по которым есть заявки.
  const serviceTabs = useMemo(() => {
    if (!items) return [];
    const map = new Map<string, { label: string; count: number }>();
    for (const i of items) {
      const entry = map.get(i.service);
      if (entry) entry.count += 1;
      else map.set(i.service, { label: i.serviceTitle, count: 1 });
    }
    return Array.from(map.entries()).map(([slug, v]) => ({ slug, ...v }));
  }, [items]);

  // Вкладки статусов — только реально встречающиеся (с учётом выбранной услуги).
  const statusTabs = useMemo(() => {
    if (!items) return [];
    const counts = new Map<string, number>();
    for (const i of items) {
      if (serviceFilter !== "all" && i.service !== serviceFilter) continue;
      counts.set(i.status, (counts.get(i.status) ?? 0) + 1);
    }
    const defaultLabels = ADMIN_STATUS_SUGGESTIONS.map((s) => s.label);
    const usedDefaults = defaultLabels.filter((label) => counts.has(label));
    const usedExtra = Array.from(counts.keys()).filter((label) => !defaultLabels.includes(label));
    return [...usedDefaults, ...usedExtra].map((label) => ({ label, count: counts.get(label) ?? 0 }));
  }, [items, serviceFilter]);

  const serviceItems = items?.filter((i) => serviceFilter === "all" || i.service === serviceFilter) ?? null;
  const visibleItems = serviceItems?.filter((i) => statusFilter === "all" || i.status === statusFilter) ?? null;

  const handleServiceFilter = (slug: string) => {
    setServiceFilter(slug);
    setStatusFilter("all");
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
        <h1 className="font-display text-xl font-semibold sm:text-2xl">Заявки по услугам</h1>
      </div>

      {serviceTabs.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5 sm:gap-2">
          <FilterTab
            active={serviceFilter === "all"}
            onClick={() => handleServiceFilter("all")}
            label="Все услуги"
            count={items?.length}
          />
          {serviceTabs.map(({ slug, label, count }) => (
            <FilterTab
              key={slug}
              active={serviceFilter === slug}
              onClick={() => handleServiceFilter(slug)}
              label={label}
              count={count}
            />
          ))}
        </div>
      )}

      {statusTabs.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-1.5 sm:mb-6 sm:gap-2">
          <FilterTab
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
            label="Любой статус"
            count={serviceItems?.length}
            subtle
          />
          {statusTabs.map(({ label, count }) => (
            <FilterTab
              key={label}
              active={statusFilter === label}
              onClick={() => setStatusFilter(label)}
              label={label}
              count={count}
              subtle
            />
          ))}
        </div>
      )}

      {error && <p className="text-rose-400">{error}</p>}

      {!error && visibleItems === null && <p className="text-metal">Загружаем…</p>}

      {visibleItems !== null && visibleItems.length === 0 && (
        <p className="text-metal">
          {items && items.length === 0 ? "Заявок по услугам пока нет." : "Заявок с такими параметрами нет."}
        </p>
      )}

      {visibleItems !== null && visibleItems.length > 0 && (
        <>
          {/* Десктоп / широкие экраны — таблица */}
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-metal">
                <tr>
                  <th className="px-4 py-3 font-medium">Клиент</th>
                  <th className="px-4 py-3 font-medium">Услуга</th>
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
                      <Link to={`/admin/service-requests/${item.id}`} className="font-medium text-silver hover:text-gold">
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-metal">{item.serviceTitle}</td>
                    <td className="px-4 py-3 text-metal">
                      <div>{item.phone}</div>
                      {item.email && <div className="text-xs">{item.email}</div>}
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

          {/* Мобильный вид — карточки вместо таблицы */}
          <div className="space-y-2.5 sm:hidden">
            {visibleItems.map((item) => (
              <Link
                key={item.id}
                to={`/admin/service-requests/${item.id}`}
                className="block rounded-xl border border-white/10 bg-white/[0.02] p-3.5 transition-colors active:bg-white/[0.05]"
              >
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <span className="min-w-0 truncate font-medium text-silver">{item.name}</span>
                  <StatusBadge status={item.status} className="shrink-0 text-[11px]" />
                </div>
                <p className="text-xs text-metal">{item.serviceTitle}</p>
                <p className="mt-1 truncate text-xs text-metal">
                  {item.phone}
                  {item.email ? ` · ${item.email}` : ""}
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
  subtle,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  /** Второй ряд фильтров (статусы) — чуть тише первого. */
  subtle?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors sm:px-4 sm:py-1.5 sm:text-sm",
        active
          ? "border-gold/60 bg-gold/10 text-gold"
          : subtle
            ? "border-white/5 text-metal/80 hover:border-white/20 hover:text-silver"
            : "border-white/10 text-metal hover:border-white/25 hover:text-silver"
      )}
    >
      {label}
      {typeof count === "number" && <span className="ml-1.5 opacity-60">{count}</span>}
    </button>
  );
}
