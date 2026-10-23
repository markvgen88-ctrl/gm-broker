import { useCallback, useMemo, useState } from "react";
import { questionnaireGraph, START_NODE_ID } from "@/data/questionnaire";
import { buildDistanceToFinalMap } from "@/lib/wizardEngine";
import type { AnswerValue, AnswersState, FieldKey } from "@/types/questionnaire";

const distanceToFinal = buildDistanceToFinalMap(questionnaireGraph);

export function useWizard() {
  const [nodeIds, setNodeIds] = useState<string[]>([START_NODE_ID]);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [direction, setDirection] = useState<1 | -1>(1);

  const currentNodeId = nodeIds[nodeIds.length - 1];
  const currentNode = questionnaireGraph[currentNodeId];

  const stepsTaken = nodeIds.length - 1;
  const remaining = distanceToFinal[currentNodeId] ?? 0;
  const progress = useMemo(() => {
    if (currentNode?.kind === "final" || currentNode?.kind === "decline") return 1;
    const total = stepsTaken + remaining;
    return total === 0 ? 0 : Math.min(stepsTaken / total, 0.96);
  }, [stepsTaken, remaining, currentNode]);

  const goNext = useCallback((field: FieldKey, value: AnswerValue, nextId: string) => {
    setDirection(1);
    setAnswers((prev) => ({ ...prev, [field]: value }));
    setNodeIds((prev) => [...prev, nextId]);
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setNodeIds((prev) => {
      if (prev.length <= 1) return prev;
      const nextIds = prev.slice(0, -1);
      const landingNodeId = nextIds[nextIds.length - 1];
      const landingNode = questionnaireGraph[landingNodeId];
      // Ответ на выбор (choice) сбрасываем — при повторном выборе другого варианта
      // маршрут может измениться. Ответ на текстовое/числовое поле (input) сохраняем,
      // чтобы пользователь мог отредактировать значение, а не вводить его заново.
      if (landingNode?.kind === "choice") {
        setAnswers((a) => {
          const copy = { ...a };
          delete copy[landingNode.field];
          return copy;
        });
      }
      return nextIds;
    });
  }, []);

  const reset = useCallback(() => {
    setDirection(1);
    setNodeIds([START_NODE_ID]);
    setAnswers({});
  }, []);

  const setFinalAnswers = useCallback((values: AnswersState) => {
    setAnswers((prev) => ({ ...prev, ...values }));
  }, []);

  return {
    currentNode,
    answers,
    direction,
    progress,
    stepIndex: stepsTaken + 1,
    canGoBack: nodeIds.length > 1,
    isFinal: currentNode?.kind === "final",
    isDecline: currentNode?.kind === "decline",
    goNext,
    goBack,
    reset,
    setFinalAnswers,
  };
}

export type UseWizardReturn = ReturnType<typeof useWizard>;
