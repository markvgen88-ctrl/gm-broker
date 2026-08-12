import { motion } from "framer-motion";
import { HiArrowDown, HiOutlineShieldCheck } from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import brokerPhoto from "@/assets/broker-photo.webp";
import heroBg from "@/assets/hero-bg.webp";
import heroBgMobile from "@/assets/hero-bg-mobile.webp";

const INFO_POINTS = [
  "Клиентам с просрочкой доступно только залоговое кредитование от 21% годовых",
  "Работаю удалённо по всей России, кроме Республики Крым и Северного Кавказа",
  "Без предоплаты",
  "Заключается договор",
  "Комиссия — 15%, только после поступления денежных средств клиенту",
];

export function Hero() {
  const scrollToForm = () => {
    document.getElementById("wizard")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden pt-28 pb-20">
      {/* Background */}
      <div className="absolute inset-0 -z-20">
        <picture>
          <source media="(max-width: 767px)" srcSet={heroBgMobile} />
          <img
            src={heroBg}
            alt=""
            className="h-full w-full object-cover opacity-45"
            fetchPriority="high"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/80 to-bg" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/40 to-bg" />
      </div>

      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-40 right-[-10%] -z-10 h-[520px] w-[520px] rounded-full bg-gold/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-[-15%] left-[-10%] -z-10 h-[420px] w-[420px] rounded-full bg-gold-deep/10 blur-[130px]" />

      <div className="container-page grid items-center gap-16 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 inline-flex items-center gap-2 rounded-full glass-panel px-4 py-2"
          >
            <HiOutlineShieldCheck className="text-gold" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-metal">
              Кредитный брокер · Работа по договору
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl font-display text-4xl font-extrabold leading-[1.1] text-silver sm:text-5xl lg:text-[3.4rem]"
          >
            Профессиональные{" "}
            <span className="text-gold-gradient animate-shimmer">кредитные решения</span>{" "}
            для частных лиц и бизнеса
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-xl text-base leading-relaxed text-metal md:text-lg"
          >
            Помощь в одобрении кредитов для физлиц, ИП и ООО по всей России —
            от 100 000 ₽ до 1,5 млрд ₽. Финансирование для тех, кому «должны
            одобрять», но банки отказывают или дают меньшую сумму.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 metal-border rounded-2xl p-5 md:p-6"
          >
            <ul className="grid gap-3 sm:grid-cols-2">
              {INFO_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm leading-snug text-metal">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  {point}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.46, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-wrap items-center gap-5"
          >
            <Button size="lg" onClick={scrollToForm}>
              Проверить шансы
              <HiArrowDown className="transition-transform duration-300 group-hover:translate-y-0.5" />
            </Button>
            <a
              href="#about"
              className="text-sm font-medium text-metal underline-offset-4 transition-colors hover:text-gold hover:underline"
            >
              Узнать подробнее
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative hidden justify-self-center lg:block"
        >
          <div className="animate-float">
            <div className="absolute inset-0 -z-10 rounded-full bg-gold/15 blur-[110px]" />

            <div className="relative w-full max-w-xs overflow-hidden rounded-[2rem] metal-border shadow-soft">
              <img
                src={brokerPhoto}
                alt="Основатель G.M. Broker"
                className="aspect-[2/3] w-full object-cover"
                width={360}
                height={540}
                fetchPriority="high"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/70 via-transparent to-transparent" />
            </div>

            <p className="mt-4 text-center font-display text-sm font-semibold tracking-wide text-silver">
              ИП Марков Геннадий Владимирович
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
