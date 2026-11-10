import { useState } from "react";
import { HiChevronDown } from "react-icons/hi";
import { cn } from "@/lib/utils";

/** Стоп-факторы: что влияет на одобрение. Текст списка задан владельцем сайта. Звёздочка расшифровывается под списком. */
const STOP_FACTORS = [
  "Действующие аресты судебным приставом*",
  "Действующая просроченная задолженность*",
  "Просрочка за последние 12 месяцев более 180 дней*",
  "Большое количество МФО*",
  "Блокировка счетов по 115-ФЗ, 161-ФЗ",
  "Отсутствие официального дохода (под залог, или реализация зарплатного проекта)",
  "Запрет на регистрационные действия с недвижимостью и авто",
  "Возраст более 65 лет.",
  "ИП срок работы до 6 месяцев, отсутствие оборотов",
  "ООО срок работы до 12 месяцев, отсутствие оборотов",
  "Задолженность по налогам*",
];

const FOOTNOTE = "* — только под залог если нет обременений";

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
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#c62828] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#c62828]/25 transition-colors duration-200 hover:bg-[#a51f1f] sm:w-auto"
        )}
      >
        Стоп-факторы
        <HiChevronDown className={cn("transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <div
          id="stop-factors-list"
          className="mt-4 max-w-2xl rounded-2xl border border-[#c62828]/25 bg-white/70 p-4 sm:p-5"
        >
          <ul className="space-y-2.5">
            {STOP_FACTORS.map((factor) => (
              <li key={factor} className="flex items-start gap-2.5 text-base leading-relaxed text-ink">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c62828]" aria-hidden="true" />
                {factor}
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-[#c62828]/15 pt-3 text-sm leading-relaxed text-muted">{FOOTNOTE}</p>
        </div>
      )}
    </div>
  );
}
