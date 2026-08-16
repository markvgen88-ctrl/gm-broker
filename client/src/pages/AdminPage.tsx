import { useEffect, useMemo, useState } from "react";
import { HiOutlineLogout, HiOutlineRefresh } from "react-icons/hi";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { LeadCard } from "@/components/admin/LeadCard";
import { adminCheckSession, adminLogout, fetchLeads } from "@/lib/adminApi";
import type { Lead, LeadStatus } from "@/lib/adminApi";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/leadStatus";

type AuthState = "checking" | "guest" | "authenticated";

export function AdminPage() {
  const [auth, setAuth] = useState<AuthState>("checking");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");

  useEffect(() => {
    document.title = "CRM — G.M. Broker";
    adminCheckSession()
      .then((ok) => setAuth(ok ? "authenticated" : "guest"))
      .catch(() => setAuth("guest"));
  }, []);

  async function loadLeads() {
    setIsLoadingLeads(true);
    setLoadError(null);
    try {
      setLeads(await fetchLeads());
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Не удалось загрузить заявки");
    } finally {
      setIsLoadingLeads(false);
    }
  }

  useEffect(() => {
    if (auth === "authenticated") {
      void loadLeads();
    }
  }, [auth]);

  function handleStatusChange(id: number, updated: Lead) {
    setLeads((prev) => prev.map((lead) => (lead.id === id ? updated : lead)));
  }

  async function handleLogout() {
    await adminLogout().catch(() => {});
    setAuth("guest");
    setLeads([]);
  }

  const counts = useMemo(() => {
    const map: Partial<Record<LeadStatus, number>> = {};
    for (const lead of leads) {
      map[lead.status] = (map[lead.status] ?? 0) + 1;
    }
    return map;
  }, [leads]);

  const visibleLeads = useMemo(
    () => (statusFilter === "all" ? leads : leads.filter((lead) => lead.status === statusFilter)),
    [leads, statusFilter]
  );

  if (auth === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <p className="text-sm text-metal">Проверяем сессию…</p>
      </div>
    );
  }

  if (auth === "guest") {
    return <AdminLogin onSuccess={() => setAuth("authenticated")} />;
  }

  return (
    <div className="min-h-screen bg-bg pb-20">
      <header className="border-b border-white/10 bg-graphite/40">
        <div className="container-page flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow">G.M. Broker</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-silver">CRM — заявки</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void loadLeads()}
              disabled={isLoadingLeads}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2.5 text-sm text-metal transition-colors hover:border-gold/60 hover:text-gold disabled:opacity-50"
            >
              <HiOutlineRefresh className={isLoadingLeads ? "animate-spin" : ""} />
              Обновить
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2.5 text-sm text-metal transition-colors hover:border-gold/60 hover:text-gold"
            >
              <HiOutlineLogout />
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="container-page mt-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              statusFilter === "all"
                ? "border-gold/60 bg-gold/10 text-gold"
                : "border-white/12 text-metal hover:border-gold/40 hover:text-gold"
            }`}
          >
            Все ({leads.length})
          </button>
          {LEAD_STATUSES.filter((s) => counts[s]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                statusFilter === status
                  ? "border-gold/60 bg-gold/10 text-gold"
                  : "border-white/12 text-metal hover:border-gold/40 hover:text-gold"
              }`}
            >
              {LEAD_STATUS_LABELS[status]} ({counts[status]})
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-3">
          {isLoadingLeads && leads.length === 0 && <p className="py-10 text-center text-sm text-metal">Загружаем заявки…</p>}

          {loadError && (
            <p className="rounded-lg border border-[#e5a3a3]/30 bg-[#e5a3a3]/10 px-4 py-3 text-sm text-[#e5a3a3]">
              {loadError}
            </p>
          )}

          {!isLoadingLeads && !loadError && visibleLeads.length === 0 && (
            <p className="py-10 text-center text-sm text-metal">Заявок пока нет.</p>
          )}

          {visibleLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onStatusChange={handleStatusChange} />
          ))}
        </div>
      </div>
    </div>
  );
}
