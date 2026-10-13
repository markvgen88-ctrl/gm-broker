import { motion } from "framer-motion";
import { HiArrowLeft, HiOutlineArrowRight } from "react-icons/hi";
import type { ChoiceNode } from "@/types/questionnaire";

interface ChoiceStepProps {
  node: ChoiceNode;
  onAnswer: (value: string, next: string) => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function ChoiceStep({ node, onAnswer, onBack, canGoBack }: ChoiceStepProps) {
  return (
    <div>
      <h3 className="font-display text-xl font-semibold leading-snug text-silver md:text-2xl">
        {node.question}
      </h3>
      {node.hint && <p className="mt-3 text-sm leading-relaxed text-metal md:text-base">{node.hint}</p>}

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {node.options.map((option, i) => (
          <motion.button
            key={option.value}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            onClick={() => onAnswer(option.value, option.next)}
            className="group flex items-center justify-between gap-3 rounded-xl metal-border px-5 py-4 text-left text-sm font-medium text-silver transition-all duration-250 hover:border-gold/60 hover:bg-gold/[0.06] active:scale-[0.98] md:text-base"
          >
            {option.label}
            <HiOutlineArrowRight className="shrink-0 text-metal transition-all duration-250 group-hover:translate-x-1 group-hover:text-gold" />
          </motion.button>
        ))}
      </div>

      {canGoBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-metal transition-colors hover:text-gold"
        >
          <HiArrowLeft /> Назад
        </button>
      )}
    </div>
  );
}
