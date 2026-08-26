import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number; // 0..1
  stepIndex: number;
}

export function ProgressBar({ progress, stepIndex }: ProgressBarProps) {
  const percent = Math.round(progress * 100);

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between text-xs font-medium uppercase tracking-[0.15em] text-metal">
        <span>Шаг {stepIndex}</span>
        <span className="text-gold">{percent}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-[#f4e5b3]"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
