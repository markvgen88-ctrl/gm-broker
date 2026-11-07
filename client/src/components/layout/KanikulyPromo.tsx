import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlinePause, HiX } from "react-icons/hi";
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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-white">
            <HiOutlinePause size={14} aria-hidden="true" /> Кредитные каникулы
          </span>
          <p className="mt-3 pr-6 font-display text-xl font-bold leading-snug text-white">
            Сколько вы отдаёте банкам <span className="text-[#ffc857]">просто так?</span>
          </p>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-white/90">
            В период отсрочки проценты не начисляются, а долг можно гасить в удобном графике.
          </p>

          <div className="mt-4 rounded-xl bg-black/20 p-3" aria-label="Пример: платёж 80 000 ₽ в месяц">
            <p className="text-[0.7rem] font-medium uppercase tracking-wider text-white/70">
              Пример: платёж 80 000 ₽ в месяц
            </p>
            <div className="mt-2.5">
              <div className="flex justify-between gap-2 text-xs text-white/85">
                <span>Сейчас</span>
                <span>≈ 40 000 ₽ уходит на проценты</span>
              </div>
              <div className="mt-1 flex h-2.5 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
                <motion.div
                  className="h-full bg-[#ff8a8a]"
                  initial={{ width: 0 }}
                  animate={{ width: "50%" }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
                <motion.div
                  className="h-full bg-white/70"
                  initial={{ width: 0 }}
                  animate={{ width: "50%" }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="flex justify-between gap-2 text-xs text-white/85">
                <span>На каникулах</span>
                <span className="font-semibold text-[#ffc857]">0 ₽ на проценты</span>
              </div>
              <div className="mt-1 flex h-2.5 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
                <motion.div
                  className="h-full bg-[#ffc857]"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
            <p className="mt-2 text-[0.7rem] leading-snug text-white/60">
              Красное: проценты, светлое и жёлтое: гашение основного долга.
            </p>
          </div>

          <Link
            to={KANIKULY_PATH}
            onClick={open}
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#ffc857] px-5 py-3 text-sm font-bold text-[#2b2260] shadow-lg shadow-black/20 transition-colors hover:bg-[#ffd77f]"
          >
            Узнать, подойдут ли мне каникулы
          </Link>
          <p className="mt-2.5 text-center text-xs leading-relaxed text-white/70">
            Для физлиц, на счетах нет ареста приставов. Условия зависят от вашей ситуации.
          </p>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
