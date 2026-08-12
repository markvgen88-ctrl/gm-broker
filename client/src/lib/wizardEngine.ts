import type { QuestionnaireGraph } from "@/types/questionnaire";

/**
 * Для каждого узла считает минимальное число шагов до ближайшего
 * терминального узла (final или decline). Используется для отображения
 * прогресс-бара в разветвлённом мастере: точное общее число шагов заранее
 * неизвестно (оно зависит от выбранной ветки), поэтому прогресс оценивается
 * как stepsTaken / (stepsTaken + distanceToFinal(currentNode)).
 */
export function buildDistanceToFinalMap(graph: QuestionnaireGraph): Record<string, number> {
  const memo: Record<string, number> = {};
  const visiting = new Set<string>();

  function dist(nodeId: string): number {
    if (memo[nodeId] !== undefined) return memo[nodeId];
    const node = graph[nodeId];
    if (!node) return 0;
    if (node.kind === "final" || node.kind === "decline") {
      memo[nodeId] = 0;
      return 0;
    }
    if (visiting.has(nodeId)) return 0; // защита от циклов (в графе их нет)
    visiting.add(nodeId);

    let nextIds: string[] = [];
    if (node.kind === "choice") nextIds = node.options.map((o) => o.next);
    if (node.kind === "input") {
      nextIds = node.dateBranch ? [node.next, node.dateBranch.belowNext] : [node.next];
    }

    const best = nextIds.length ? Math.min(...nextIds.map(dist)) + 1 : 0;
    visiting.delete(nodeId);
    memo[nodeId] = best;
    return best;
  }

  Object.keys(graph).forEach(dist);
  return memo;
}
