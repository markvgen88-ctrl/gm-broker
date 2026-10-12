import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { adminCheckSession, adminLogout } from "@/lib/adminApi";

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
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
