import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { HiX } from "react-icons/hi";
import { cta } from "@/lib/cta";
import { CONTACT_EMAIL } from "@/data/contact";
import type { Service } from "@/data/services";

interface ServiceLinkProps {
  service: Service;
  className?: string;
  children: ReactNode;
}

/**
 * Ссылка на вид услуги. Для готовых услуг — обычный переход на страницу.
 * Для услуг со статусом «Скоро» — кнопка, которая открывает окно
 * «Раздел в разработке» с почтой для обращений.
 */
export function ServiceLink({ service, className, children }: ServiceLinkProps) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!service.comingSoon) {
    return (
      <Link to={`/services/${service.slug}`} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} aria-haspopup="dialog">
        {children}
      </button>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] grid place-items-center bg-ink/60 p-4"
            onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="soon-title"
              className="relative w-full max-w-md rounded-3xl bg-paper p-7 text-ink shadow-2xl"
            >
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-line bg-white text-ink"
                aria-label="Закрыть"
              >
                <HiX />
              </button>
              <p className="text-sm font-semibold text-pine">Скоро</p>
              <h2 id="soon-title" className="mt-2 pr-8 font-display text-2xl font-bold leading-tight tracking-tight">
                {service.title.replace("-", "\u2011")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Раздел в разработке. По всем вопросам обращайтесь на почту:
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-2 inline-block font-display text-lg font-semibold text-pine underline underline-offset-4"
              >
                {CONTACT_EMAIL}
              </a>
              <button type="button" onClick={() => setOpen(false)} className={cta("ink", "md", "mt-7 w-full")}>
                Понятно
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
