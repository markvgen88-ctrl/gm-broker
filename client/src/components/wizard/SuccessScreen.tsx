import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineCheckCircle } from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import { reachGoal } from "@/lib/metrika";
import { GOALS, KANIKULY_PATH, hidePromoForVisit } from "@/lib/kanikuly";

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
        <div className="mt-8 w-full max-w-md rounded-2xl border border-white/10 p-5 text-left">
          <p className="font-display text-lg font-bold text-silver">Платите по кредитам, и это тяжело?</p>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-metal">
            Пока ждёте ответ: кредитные каникулы. В период отсрочки проценты не начисляются, а долг можно гасить в
            удобном графике. Услуга для физических лиц, при условии что на счетах нет ареста судебных приставов.
          </p>
          <Link
            to={KANIKULY_PATH}
            onClick={() => reachGoal(GOALS.offerClick)}
            className="metal-border mt-4 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-silver transition-colors hover:border-gold/60 hover:text-gold"
          >
            Ознакомиться с условиями
          </Link>
        </div>
      )}

      <Button variant="secondary" className="mt-8" onClick={onReset}>
        Пройти опрос заново
      </Button>
    </motion.div>
  );
}
