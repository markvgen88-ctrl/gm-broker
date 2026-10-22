import { Link } from "react-router-dom";
import { HiArrowLeft } from "react-icons/hi";
import { Reveal } from "@/components/ui/Reveal";
import { useSeo } from "@/hooks/useSeo";
import { CommissionCalculator } from "@/components/calculator/CommissionCalculator";

export function CalculatorPage() {
  useSeo({
    title: "Калькулятор комиссии кредитного брокера — G.M. Broker",
    description:
      "Узнайте ориентировочную стоимость услуг кредитного брокера: ответьте на несколько вопросов и получите вилку комиссии в процентах и рублях.",
    canonicalPath: "/calculator",
  });

  return (
    <main className="pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-pine"
            >
              <HiArrowLeft /> На главную
            </Link>
          </Reveal>

          <Reveal delay={0.06}>
            <span className="mt-8 block text-sm font-semibold text-pine">Условия работы</span>
            <h1 className="mt-3 font-display text-3xl font-bold leading-[1.15] text-ink sm:text-4xl md:text-[2.6rem]">
              Калькулятор комиссии
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
              Ответьте на несколько вопросов о себе и получите ориентировочную стоимость услуги. Комиссия оплачивается
              только после того, как деньги поступили вам на счёт.
            </p>
          </Reveal>

          <div className="my-10 h-px bg-line" />

          <Reveal delay={0.1}>
            <CommissionCalculator />
          </Reveal>
        </div>
      </div>
    </main>
  );
}
