import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { adminCheckSession, adminLogout } from "@/lib/adminApi";
import { cn } from "@/lib/utils";

export function AdminLayout() {
  const [authState, setAuthState] = useState<"checking" | "authed" | "guest">("checking");
  const navigate = useNavigate();
  const location = useLocation();
  const justLoggedIn = Boolean((location.state as { justLoggedIn?: boolean } | null)?.justLoggedIn);

  useEffect(() => {
    let cancelled = false;
    // Сразу после входа первая проверка сессии иногда не проходит (кука ещё не
    // «закрепилась» в браузере), хотя после F5 всё работает. Поэтому только в
    // этом случае даём ещё две попытки с паузой, прежде чем вернуть на логин.
    const retryDelays = justLoggedIn ? [400, 1200] : [];
    (async () => {
      let ok = await adminCheckSession();
      for (const delay of retryDelays) {
        if (ok || cancelled) break;
        await new Promise((resolve) => setTimeout(resolve, delay));
        if (cancelled) break;
        ok = await adminCheckSession();
      }
      if (!cancelled) setAuthState(ok ? "authed" : "guest");
    })();
    return () => {
      cancelled = true;
    };
  }, [justLoggedIn]);

  const handleLogout = async () => {
    await adminLogout();
    navigate("/admin/login", { replace: true });
  };

  // Разделы CRM: анкеты на кредитование, заявки по услугам и шаблоны писем.
  const onServices = location.pathname.startsWith("/admin/service-requests");
  const onTemplates = location.pathname.startsWith("/admin/email-templates");
  const onSettings = location.pathname.startsWith("/admin/survey-settings");

  if (authState === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-metal">
        Проверяем сессию…
      </div>
    );
  }

  if (authState === "guest") {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-bg text-silver">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/admin" className="font-display text-base font-semibold tracking-tight sm:text-lg">
            G.M. Broker <span className="text-gold">· CRM</span>
          </Link>
          <Button variant="ghost" size="md" onClick={handleLogout} className="px-0 py-0 sm:px-2">
            Выйти
          </Button>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-2 px-4 pb-3 sm:px-6">
          <SectionTab to="/admin" active={!onServices && !onTemplates && !onSettings}>
            Кредитование
          </SectionTab>
          <SectionTab to="/admin/service-requests" active={onServices}>
            Услуги
          </SectionTab>
          <SectionTab to="/admin/email-templates" active={onTemplates}>
            Шаблоны писем
          </SectionTab>
          <SectionTab to="/admin/survey-settings" active={onSettings}>
            Настройки опроса
          </SectionTab>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}

function SectionTab({ to, active, children }: { to: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      to={to}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm transition-colors",
        active
          ? "border-gold/60 bg-gold/10 text-gold"
          : "border-white/10 text-metal hover:border-white/25 hover:text-silver"
      )}
    >
      {children}
    </Link>
  );
}
