import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiOutlineClock, HiOutlineLockClosed } from "react-icons/hi";
import { ProgressBar } from "@/components/wizard/ProgressBar";
import { ChoiceStep } from "@/components/wizard/ChoiceStep";
import { InputStep } from "@/components/wizard/InputStep";
import { FinalStep, type FinalFormValues } from "@/components/wizard/FinalStep";
import { AgreementStep } from "@/components/wizard/AgreementStep";
import { DeclineStep } from "@/components/wizard/DeclineStep";
import { SuccessScreen } from "@/components/wizard/SuccessScreen";
import { useWizard } from "@/hooks/useWizard";
import { submitApplication } from "@/lib/api";
import type { AnswersState } from "@/types/questionnaire";
import { normalizeTelegram } from "@/lib/telegram";

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

    const telegram = normalizeTelegram(values.telegram) ?? "";
    const finalAnswers: AnswersState = {
      ...wizard.answers,
      name: values.name,
      phone: values.phone,
      contactInfo: values.contactInfo,
      ...(telegram ? { telegram } : {}),
    };

    try {
      await submitApplication({
        clientType: (finalAnswers.clientType as "individual" | "entrepreneur" | "legal_entity") ?? "individual",
        answers: finalAnswers,
        submittedAt: new Date().toISOString(),
      });
      wizard.setFinalAnswers({
        name: values.name,
        phone: values.phone,
        contactInfo: values.contactInfo,
        ...(telegram ? { telegram } : {}),
      });
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
    <section id="wizard" className="wizard-skin section-y scroll-mt-16 bg-ink">
      <div className="container-page">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="measure mx-auto font-display text-2xl font-semibold leading-snug tracking-[-0.02em] text-white md:text-3xl">
            Проверьте свои шансы на одобрение, пройдя наш специальный опрос.
          </h2>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-white/10 bg-graphite p-6 md:p-10">
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
                        {currentNode.kind === "agreement" && (
                          <AgreementStep
                            node={currentNode}
                            onAnswer={(value, next) => wizard.goNext(currentNode.field, value, next)}
                            onBack={wizard.goBack}
                            canGoBack={wizard.canGoBack}
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
        </div>

        {!submitted && (
          <div className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <HiOutlineClock className="text-pine-bright" /> Займёт около 2 минут
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HiOutlineLockClosed className="text-pine-bright" /> Данные передаются конфиденциально
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
