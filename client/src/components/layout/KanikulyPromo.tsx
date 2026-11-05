import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { HiX } from "react-icons/hi";
import { cta } from "@/lib/cta";
import { reachGoal } from "@/lib/metrika";
import {
  GOALS,
  KANIKULY_PATH,
  PROMO_DELAY_SECONDS,
  hidePromoForVisit,
  isPromoHiddenThisVisit,
} from "@/lib/kanikuly";

/**
 * Ненавязчивая плашка про кредитные каникулы в углу экрана.
 *
 * Правила (чтобы не мешать главной цели сайта — анкете):
 *  - появляется через PROMO_DELAY_SECONDS секунд после входа на сайт (таймер не
 *    сбрасывается при переходах между страницами);
 *  - не закрывает экран: небольшая карточка, закрывается крестиком;
 *  - не показывается в /admin, на самой странице услуги и пока на экране виден
 *    блок анкеты (#wizard);
 *  - при каждом новом заходе на сайт показывается снова, даже если её закрывали
 *    раньше; внутри одного захода после закрытия или перехода не повторяется.
 */
export function KanikulyPromo() {
  const { pathname } = useLocation();
  const [ready, setReady] = useState(false);
  const [wizardInView, setWizardInView] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const shownReported = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), PROMO_DELAY_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, []);

  // Следим, виден ли блок анкеты на текущей странице.
  useEffect(() => {
    setWizardInView(false);
    if (!ready) return;
    let cleanup = () => {};
    const timer = window.setTimeout(() => {
      const el = document.getElementById("wizard");
      if (!el || typeof IntersectionObserver === "undefined") return;
      const observer = new IntersectionObserver(([entry]) => setWizardInView(entry.isIntersecting), {
        threshold: 0.05,
      });
      observer.observe(el);
      cleanup = () => observer.disconnect();
    }, 300);
    return () => {
      window.clearTimeout(timer);
      cleanup();
    };
  }, [pathname, ready]);

  const onAllowedPage = !pathname.startsWith("/admin") && pathname !== KANIKULY_PATH;
  const visible = ready && onAllowedPage && !dismissed && !wizardInView && !isPromoHiddenThisVisit();

  useEffect(() => {
    if (visible && !shownReported.current) {
      shownReported.current = true;
      reachGoal(GOALS.promoShown);
    }
  }, [visible]);

  const close = () => {
    hidePromoForVisit();
    setDismissed(true);
    reachGoal(GOALS.promoClose);
  };

  const open = () => {
    hidePromoForVisit();
    setDismissed(true);
    reachGoal(GOALS.promoClick);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          key="kanikuly-promo"
          role="complementary"
          aria-label="Кредитные каникулы"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed left-4 right-4 z-40 rounded-2xl border border-line bg-white p-5 shadow-2xl sm:left-auto sm:right-6 sm:max-w-sm"
          style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Закрыть"
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-mint hover:text-ink"
          >
            <HiX size={18} />
          </button>
          <p className="pr-8 font-display text-lg font-bold leading-snug text-ink">
            Платите по кредитам, и это тяжело?
          </p>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-ink/85">
            Кредитные каникулы: проценты в период отсрочки не начисляются, а долг можно гасить в удобном графике.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Для физических лиц. Условия зависят от вашей ситуации.
          </p>
          <Link to={KANIKULY_PATH} onClick={open} className={cta("solid", "sm", "mt-4 w-full sm:w-auto")}>
            Ознакомиться с условиями
          </Link>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
