import { cn } from "@/lib/utils";

const MSK_TZ = "Europe/Moscow";
const IRK_TZ = "Asia/Irkutsk";

const shortOpts: Intl.DateTimeFormatOptions = { dateStyle: "short", timeStyle: "short" };
const longOpts: Intl.DateTimeFormatOptions = { dateStyle: "long", timeStyle: "short" };

const mskShort = new Intl.DateTimeFormat("ru-RU", { ...shortOpts, timeZone: MSK_TZ });
const irkShort = new Intl.DateTimeFormat("ru-RU", { ...shortOpts, timeZone: IRK_TZ });
const mskLong = new Intl.DateTimeFormat("ru-RU", { ...longOpts, timeZone: MSK_TZ });
const irkLong = new Intl.DateTimeFormat("ru-RU", { ...longOpts, timeZone: IRK_TZ });

/**
 * Время заявки сразу в двух часовых поясах: Москва и Иркутск (разница 5 часов,
 * поэтому дата в Иркутске может оказаться следующей — дата показывается у обоих).
 *  - stack  — две строки (для списков и карточек в списке);
 *  - inline — одной строкой с длинной датой (для шапки карточки заявки).
 */
export function DualTime({
  iso,
  variant = "stack",
  className,
}: {
  iso: string;
  variant?: "stack" | "inline";
  className?: string;
}) {
  const date = new Date(iso);

  if (variant === "inline") {
    return (
      <span className={className}>
        {mskLong.format(date)} <span className="text-metal/70">МСК</span>
        {" · "}
        {irkLong.format(date)} <span className="text-metal/70">Иркутск</span>
      </span>
    );
  }

  return (
    <span className={cn("block leading-snug", className)}>
      <span className="block">
        {mskShort.format(date)} <span className="text-[11px] text-metal/70">МСК</span>
      </span>
      <span className="block text-xs">
        {irkShort.format(date)} <span className="text-[11px] text-metal/70">Иркутск</span>
      </span>
    </span>
  );
}
