import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineClock, HiOutlineLockClosed } from "react-icons/hi";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ProgressBar } from "@/components/wizard/ProgressBar";
import { ChoiceStep } from "@/components/wizard/ChoiceStep";
import { InputStep } from "@/components/wizard/InputStep";
import { FinalStep, type FinalFormValues } from "@/components/wizard/FinalStep";
import { DeclineStep } from "@/components/wizard/DeclineStep";
import { SuccessScreen } from "@/components/wizard/SuccessScreen";
import { useWizard } from "@/hooks/useWizard";
import { submitApplication } from "@/lib/api";
import type { AnswersState } from "@/types/questionnaire";

const slideVariants = {
  enter: (direction: 1 | -1) => ({ opacity: 0, x: direction * 32 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: 1 | -1) => ({ opacity: 0, x: direction * -32 }),
};

export function Wizard() {
  const wizard = useWizard();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFinalSubmit = async (values: FinalFormValues) => {
    setSubmitting(true);
    setSubmitError(null);

    const finalAnswers: AnswersState = {
      ...wizard.answers,
      name: values.name,
      contactInfo: values.contactInfo,
    };

    try {
      await submitApplication({
        clientType: (finalAnswers.clientType as "individual" | "entrepreneur" | "legal_entity") ?? "individual",
        answers: finalAnswers,
        submittedAt: new Date().toISOString(),
      });
      wizard.setFinalAnswers({ name: values.name, contactInfo: values.contactInfo });
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Не удалось отправить заявку. Попробуйте ещё раз."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    wizard.reset();
    setSubmitted(false);
    setSubmitError(null);
  };

  return (
    <section id="wizard" className="relative py-24 md:py-32">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-gold/[0.06] blur-[160px]" />
      <div className="container-page">
        <SectionHeading
          eyebrow="Проверка шансов на кредит"
          title="Узнайте свои шансы за пару минут"
          description="Отвечайте честно — это короткий пошаговый опрос, а не длинная анкета. Данные используются только для оценки вашей ситуации."
          className="mb-14"
        />

        <Reveal className="mx-auto max-w-2xl">
          <div className="metal-border rounded-3xl bg-graphite/40 p-6 shadow-soft backdrop-blur-sm md:p-10">
            {submitted ? (
              <SuccessScreen onReset={handleReset} />
            ) : (
              <>
                <ProgressBar progress={wizard.progress} stepIndex={wizard.stepIndex} />
                <AnimatePresence mode="wait" custom={wizard.direction} initial={false}>
                  {(() => {
                    const currentNode = wizard.currentNode;
                    return (
                      <motion.div
                        key={currentNode.id}
                        custom={wizard.direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {currentNode.kind === "choice" && (
                          <ChoiceStep
                            node={currentNode}
                            onAnswer={(value, next) => wizard.goNext(currentNode.field, value, next)}
                            onBack={wizard.goBack}
                            canGoBack={wizard.canGoBack}
                          />
                        )}
                        {currentNode.kind === "input" && (
                          <InputStep
                            node={currentNode}
                            defaultValue={wizard.answers[currentNode.field]}
                            onAnswer={(value, next) => wizard.goNext(currentNode.field, value, next)}
                            onBack={wizard.goBack}
                            canGoBack={wizard.canGoBack}
                          />
                        )}
                        {currentNode.kind === "final" && (
                          <FinalStep
                            node={currentNode}
                            onSubmit={handleFinalSubmit}
                            onBack={wizard.goBack}
                            isSubmitting={submitting}
                            submitError={submitError}
                          />
                        )}
                        {currentNode.kind === "decline" && (
                          <DeclineStep
                            node={currentNode}
                            onBack={wizard.goBack}
                            onReset={handleReset}
                            canGoBack={wizard.canGoBack}
                          />
                        )}
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </>
            )}
          </div>
        </Reveal>

        {!submitted && (
          <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-metal/70">
            <span className="inline-flex items-center gap-1.5">
              <HiOutlineClock className="text-gold" /> Займёт около 2 минут
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HiOutlineLockClosed className="text-gold" /> Данные передаются конфиденциально
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
