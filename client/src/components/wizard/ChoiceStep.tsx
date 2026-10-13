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
      <h3 className="text-2xl leading-snug text-silver md:text-[1.9rem]">
        {node.question}
      </h3>
      {node.hint && <p className="mt-3 text-sm leading-relaxed text-metal md:text-base">{node.hint}</p>}

      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        {node.options.map((option, i) => (
          <motion.button
            key={option.value}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            onClick={() => onAnswer(option.value, option.next)}
            className="group flex items-center justify-between gap-3 rounded-lg border border-white/15 px-5 py-5 text-left text-base font-medium text-silver transition-colors duration-300 hover:border-gold hover:bg-white/[0.04] active:bg-white/[0.07]"
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
