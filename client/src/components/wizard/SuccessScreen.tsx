import { motion } from "framer-motion";
import { HiOutlineCheckCircle } from "react-icons/hi";
import { Button } from "@/components/ui/Button";

interface SuccessScreenProps {
  onReset: () => void;
}

export function SuccessScreen({ onReset }: SuccessScreenProps) {
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
      <Button variant="secondary" className="mt-8" onClick={onReset}>
        Пройти опрос заново
      </Button>
    </motion.div>
  );
}
