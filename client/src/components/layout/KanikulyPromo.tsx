import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { HiX } from "react-icons/hi";
import { reachGoal } from "@/lib/metrika";
import {
  GOALS,
  KANIKULY_PATH,
  PROMO_CLOSE_DELAY_SECONDS,
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
 *  - не закрывает экран: небольшая карточка; крестик «Закрыть» появляется через
 *    PROMO_CLOSE_DELAY_SECONDS секунд после показа;
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
  const [closeReady, setCloseReady] = useState(false);
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

  // Крестик появляется не сразу: отсчёт идёт, пока плашка на экране.
  useEffect(() => {
    if (!visible || closeReady) return;
    const timer = window.setTimeout(() => setCloseReady(true), PROMO_CLOSE_DELAY_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [visible, closeReady]);

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
          className="fixed left-4 right-4 z-40 rounded-2xl bg-gradient-to-br from-[#3f37c9] to-[#6c5ce7] p-5 text-white shadow-2xl shadow-[#3f37c9]/30 sm:left-auto sm:right-6 sm:max-w-sm"
          style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {closeReady && (
            <motion.button
              type="button"
              onClick={close}
              aria-label="Закрыть"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-white/80 hover:bg-white/15 hover:text-white"
            >
              <HiX size={18} />
            </motion.button>
          )}
          <p className="pr-8 font-display text-lg font-bold leading-snug text-white">
            Платите по кредитам, и это тяжело?
          </p>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-white/90">
            Кредитные каникулы: проценты в период отсрочки не начисляются, а долг можно гасить в удобном графике.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/70">
            Для физических лиц. Условия зависят от вашей ситуации.
          </p>
          <Link to={KANIKULY_PATH} onClick={open} className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#ffc857] px-4 py-2.5 text-sm font-semibold text-[#2b2260] transition-colors hover:bg-[#ffd77f] sm:w-auto">
            Ознакомиться с условиями
          </Link>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
