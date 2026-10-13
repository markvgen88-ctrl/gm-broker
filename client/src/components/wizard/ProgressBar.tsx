import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number; // 0..1
  stepIndex: number;
}

export function ProgressBar({ progress, stepIndex }: ProgressBarProps) {
  const percent = Math.round(progress * 100);

  return (
    <div className="mb-10">
      <div className="mb-3 flex items-baseline justify-between text-xs font-medium uppercase tracking-[0.2em] text-metal">
        <span>Шаг {stepIndex}</span>
        <span className="font-serif text-sm normal-case tracking-normal text-gold">{percent}%</span>
      </div>
      <div className="h-px w-full bg-white/15">
        <motion.div
          className="h-[3px] -translate-y-px rounded-full bg-gold"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
