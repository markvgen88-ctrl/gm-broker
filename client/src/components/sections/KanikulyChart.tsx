import { motion } from "framer-motion";

/**
 * Наглядный пример для страницы «Кредитные каникулы»: куда уходит платёж
 * 80 000 ₽ без каникул и на каникулах. Цифры — те же, что в тексте раздела
 * «Сколько вы отдаёте банкам просто так…» (services.ts): около половины
 * платежа — проценты. Подключается в pages/ServicePage.tsx.
 */
const EASE = [0.16, 1, 0.3, 1] as const;

function Bar({
  parts,
  delay,
}: {
  parts: { width: string; className: string }[];
  delay: number;
}) {
  return (
    <div className="flex h-4 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
      {parts.map((p, i) => (
        <motion.div
          key={i}
          className={`h-full ${p.className}`}
          initial={{ width: 0 }}
          whileInView={{ width: p.width }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.9, delay, ease: EASE }}
        />
      ))}
    </div>
  );
}

export function KanikulyChart() {
  return (
    <figure className="mt-6 rounded-2xl bg-mint p-5 md:p-6" aria-label="Пример: платёж 80 000 рублей в месяц">
      <figcaption className="text-xs font-semibold uppercase tracking-wider text-muted">
        Пример: платёж 80 000 ₽ в месяц
      </figcaption>

      <div className="mt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm text-ink">
          <span className="font-semibold">Сейчас</span>
          <span>≈ 40 000 ₽ уходит банку на проценты</span>
        </div>
        <div className="mt-2">
          <Bar
            delay={0.1}
            parts={[
              { width: "50%", className: "bg-[#e05a5a]" },
              { width: "50%", className: "bg-pine/45" },
            ]}
          />
        </div>
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm text-ink">
          <span className="font-semibold">На каникулах</span>
          <span className="font-semibold text-pine">0 ₽ на проценты, весь платёж в основной долг</span>
        </div>
        <div className="mt-2">
          <Bar delay={0.4} parts={[{ width: "100%", className: "bg-pine-bright" }]} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e05a5a]" /> проценты
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-pine/45" /> погашение долга
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-pine-bright" /> погашение долга без процентов
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Пример для наглядности, не расчёт по вашим кредитам. Условия зависят от количества кредитов и вашей ситуации.
      </p>
    </figure>
  );
}
