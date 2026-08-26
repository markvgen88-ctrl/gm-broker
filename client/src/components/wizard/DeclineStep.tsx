import { motion } from "framer-motion";
import { HiArrowLeft, HiOutlineInformationCircle } from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import type { DeclineNode } from "@/types/questionnaire";

interface DeclineStepProps {
  node: DeclineNode;
  onBack: () => void;
  onReset: () => void;
  canGoBack: boolean;
}

export function DeclineStep({ node, onBack, onReset, canGoBack }: DeclineStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center py-4 text-center"
    >
      <div className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-white/5 text-metal">
        <HiOutlineInformationCircle size={36} />
      </div>
      <h3 className="font-display text-xl font-semibold leading-snug text-silver md:text-2xl">
        {node.message}
      </h3>
      {node.hint && (
        <p className="mt-4 max-w-md text-sm leading-relaxed text-metal md:text-base">{node.hint}</p>
      )}

      <div className="mt-8 flex items-center gap-4">
        {canGoBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-metal transition-colors hover:text-gold"
          >
            <HiArrowLeft /> Назад
          </button>
        )}
        <Button variant="secondary" onClick={onReset}>
          Пройти опрос заново
        </Button>
      </div>
    </motion.div>
  );
}
