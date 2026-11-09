import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { fetchAdminSurveySettings, saveMinLoanAmount } from "@/lib/adminApi";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 pr-10 text-sm text-silver outline-none focus:border-gold/60";

const formatAmount = (value: number) => value.toLocaleString("ru-RU");
const parseAmount = (text: string) => Number(text.replace(/\s/g, ""));

/**
 * Настройки опроса на сайте. Пока одна: минимальная сумма кредита. Если клиент
 * вводит меньше, анкета показывает вежливый экран отказа и заявка не отправляется.
 */
export function AdminSurveySettingsPage() {
  const [saved, setSaved] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAdminSurveySettings()
      .then((s) => {
        if (cancelled) return;
        setSaved(s.minLoanAmount);
        setText(formatAmount(s.minLoanAmount));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Не удалось загрузить настройки");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) return <p className="text-sm text-rose-400">{loadError}</p>;
  if (saved === null) return <p className="text-metal">Загружаем настройки…</p>;

  const value = parseAmount(text);
  const valid = text.trim() !== "" && Number.isInteger(value) && value >= 0;
  const dirty = valid && value !== saved;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    setNote(null);
    try {
      const settings = await saveMinLoanAmount(value);
      setSaved(settings.minLoanAmount);
      setText(formatAmount(settings.minLoanAmount));
      setNote("Сохранено. Новое значение уже действует на сайте.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-silver sm:text-2xl">Настройки опроса</h1>
        <p className="mt-2 text-sm leading-relaxed text-metal">
          Параметры анкеты на сайте. Изменения применяются сразу, перезапускать и выкладывать сайт не нужно.
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-graphite/40 p-4 sm:p-5">
        <h2 className="mb-3 text-[11px] font-bold tracking-wider text-gold uppercase">Минимальная сумма кредита</h2>
        <div className="relative max-w-xs">
          <input
            type="text"
            inputMode="numeric"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setNote(null);
              setError(null);
            }}
            onBlur={() => valid && setText(formatAmount(value))}
            className={inputClass}
            aria-label="Минимальная сумма кредита, рублей"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-medium text-gold">
            ₽
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-metal">
          Если клиент в анкете укажет сумму меньше, он увидит сообщение «Мы работаем с суммами кредита от{" "}
          {valid ? formatAmount(value) : "…"} ₽», а заявка не отправится и в CRM не появится. Значение 0 отключает
          ограничение. Подсказка под вопросом о сумме подстраивается сама.
        </p>
        {!valid && text.trim() !== "" && <p className="mt-2 text-sm text-rose-400">Введите целое число, 0 или больше.</p>}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? "Сохраняем…" : "Сохранить"}
          </Button>
          {note && <span className="text-sm text-emerald-300">{note}</span>}
          {error && <span className="text-sm text-rose-400">{error}</span>}
        </div>
      </section>
    </div>
  );
}
