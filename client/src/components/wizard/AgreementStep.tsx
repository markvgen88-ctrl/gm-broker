import { useState } from "react";
import { HiArrowLeft } from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import type { AgreementNode } from "@/types/questionnaire";

interface AgreementStepProps {
  node: AgreementNode;
  onAnswer: (value: string, next: string) => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function AgreementStep({ node, onAnswer, onBack, canGoBack }: AgreementStepProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div>
      <h3 className="font-display text-xl font-semibold leading-snug text-silver md:text-2xl">
        {node.question}
      </h3>

      <div className="mt-5 grid gap-3 text-sm leading-relaxed text-metal md:text-base">
        {node.body.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      <label className="mt-8 flex cursor-pointer items-start gap-3 rounded-xl metal-border bg-graphite/40 px-5 py-4 text-sm leading-relaxed text-metal">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-gold"
        />
        <span>{node.checkboxLabel}</span>
      </label>

      <div className="mt-8 flex items-center justify-between gap-4">
        {canGoBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-metal transition-colors hover:text-gold"
          >
            <HiArrowLeft /> Назад
          </button>
        ) : (
          <span />
        )}
        <Button
          type="button"
          size="lg"
          disabled={!checked}
          onClick={() => onAnswer("yes", node.next)}
        >
          {node.buttonLabel ?? "Понятно, продолжить"}
        </Button>
      </div>
    </div>
  );
}
