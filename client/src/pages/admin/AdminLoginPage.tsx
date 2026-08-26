import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { adminCheckSession, adminLogin } from "@/lib/adminApi";

export function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alreadyAuthed, setAlreadyAuthed] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    adminCheckSession().then(setAlreadyAuthed);
  }, []);

  if (alreadyAuthed) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminLogin(password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось войти");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6 text-silver">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-graphite/60 p-8 shadow-soft"
      >
        <h1 className="mb-1 font-display text-xl font-semibold">G.M. Broker · CRM</h1>
        <p className="mb-6 text-sm text-metal">Введите пароль для доступа к заявкам.</p>

        <label className="mb-2 block text-xs uppercase tracking-wide text-metal">Пароль</label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-silver outline-none focus:border-gold/60"
          placeholder="••••••••"
        />

        {error && <p className="mb-4 text-sm text-rose-400">{error}</p>}

        <Button type="submit" variant="primary" size="md" className="w-full" disabled={loading || !password}>
          {loading ? "Входим…" : "Войти"}
        </Button>
      </form>
    </div>
  );
}
