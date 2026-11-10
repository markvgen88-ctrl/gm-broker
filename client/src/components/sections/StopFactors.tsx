import { useState } from "react";
import { HiChevronDown } from "react-icons/hi";
import { cta } from "@/lib/cta";
import { cn } from "@/lib/utils";

/** Стоп-факторы: что влияет на одобрение. Текст списка задан владельцем сайта. */
const STOP_FACTORS = [
  "Действующие аресты судебным приставом (только под залог если нет обременений)",
  "Действующая просроченная задолженность (только под залог если нет обременений)",
  "Просрочка за последние 12 месяцев более 180 дней (только под залог если нет обременений)",
  "Большое количество МФО (только под залог если нет обременений)",
  "Блокировка счетов по 115-ФЗ, 161-ФЗ",
  "Отсутствие официального дохода (под залог, или реализация зарплатного проекта)",
  "Запрет на регистрационные действия с недвижимостью и авто",
  "Возраст более 65 лет.",
  "ИП срок работы до 6 месяцев, отсутствие оборотов",
  "ООО срок работы до 12 месяцев, отсутствие оборотов",
];

/** Кнопка «Стоп-факторы» на первом экране: по нажатию раскрывается список. */
export function StopFactors() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="stop-factors-list"
        className={cta("outline", "lg", "w-full gap-2 sm:w-auto")}
      >
        Стоп-факторы
        <HiChevronDown className={cn("transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <ul
          id="stop-factors-list"
          className="mt-4 max-w-2xl space-y-2.5 rounded-2xl border border-[#c62828]/25 bg-white/70 p-4 sm:p-5"
        >
          {STOP_FACTORS.map((factor) => (
            <li key={factor} className="flex items-start gap-2.5 text-base leading-relaxed text-ink">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c62828]" aria-hidden="true" />
              {factor}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
