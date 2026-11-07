import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineCheckCircle, HiOutlinePause } from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import { reachGoal } from "@/lib/metrika";
import { GOALS, KANIKULY_COPY, KANIKULY_PATH, hidePromoForVisit } from "@/lib/kanikuly";

interface SuccessScreenProps {
  onReset: () => void;
  /** Показать предложение про кредитные каникулы (физлицо с действующими кредитами). */
  offerKanikuly?: boolean;
}

export function SuccessScreen({ onReset, offerKanikuly = false }: SuccessScreenProps) {
  useEffect(() => {
    if (!offerKanikuly) return;
    reachGoal(GOALS.offerShown);
    // Тем, кому предложили здесь, плашку с тем же предложением в этом заходе не показываем.
    hidePromoForVisit();
  }, [offerKanikuly]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center py-6 text-center"
    >
      <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-gold/10 text-gold">
        <HiOutlineCheckCircle size={44} />
      </div>
      <h3 className="font-display text-2xl font-bold text-silver md:text-3xl">Ваша анкета отправлена!</h3>
      <p className="mt-4 max-w-md text-base leading-relaxed text-metal">
        Ожидайте, пожалуйста, ответ в течение 24 часов. Спасибо, что обратились!
      </p>

      {offerKanikuly && (
        <div className="mt-8 w-full max-w-md rounded-2xl bg-gradient-to-br from-[#3f37c9] to-[#6c5ce7] p-5 text-left text-white shadow-2xl shadow-[#3f37c9]/30">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-white">
            <HiOutlinePause size={14} aria-hidden="true" /> {KANIKULY_COPY.label}
          </span>
          <p className="mt-3 font-display text-xl font-bold leading-snug text-white">
            {KANIKULY_COPY.headlineLead}
            <span className="text-[#ffc857]">{KANIKULY_COPY.headlineAccent}</span>
          </p>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-white/90">{KANIKULY_COPY.text}</p>
          <Link
            to={KANIKULY_PATH}
            onClick={() => reachGoal(GOALS.offerClick)}
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[#ffc857] px-5 py-3 text-sm font-bold text-[#2b2260] shadow-lg shadow-black/20 transition-colors hover:bg-[#ffd77f]"
          >
            {KANIKULY_COPY.cta}
          </Link>
          <p className="mt-2.5 text-center text-xs leading-snug text-white/70">{KANIKULY_COPY.note}</p>
        </div>
      )}

      <Button variant="secondary" className="mt-8" onClick={onReset}>
        Пройти опрос заново
      </Button>
    </motion.div>
  );
}
