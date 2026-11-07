import { questionnaireGraph, START_NODE_ID } from "@/data/questionnaire";
import type { AnswersState, QuestionNode } from "@/types/questionnaire";

/**
 * Сохранение прогресса анкеты на время сессии браузера (sessionStorage):
 * обновление страницы не сбрасывает ответы, а закрытие вкладки — сбрасывает,
 * чтобы данные клиента не оставались на чужом компьютере.
 *
 * Номер в ключе — версия формата. Кроме того, при чтении путь проверяется по
 * текущему графу анкеты: если после выкладки новой версии вопросов сохранённый
 * маршрут больше не сходится, он тихо отбрасывается и анкета начинается заново.
 */
const STORAGE_KEY = "gmb_wizard_v1";

export interface SavedWizard {
  nodeIds: string[];
  answers: AnswersState;
}

function nextIdsOf(node: QuestionNode): string[] {
  if (node.kind === "choice") return node.options.map((o) => o.next);
  if (node.kind === "input") return node.dateBranch ? [node.next, node.dateBranch.belowNext] : [node.next];
  if (node.kind === "agreement") return [node.next];
  return [];
}

function isValidPath(ids: unknown): ids is string[] {
  if (!Array.isArray(ids) || ids.length === 0 || ids[0] !== START_NODE_ID) return false;
  for (let i = 0; i < ids.length; i++) {
    const node = questionnaireGraph[ids[i]];
    if (!node) return false;
    if (i > 0 && !nextIdsOf(questionnaireGraph[ids[i - 1]]).includes(ids[i])) return false;
  }
  return true;
}

function isValidAnswers(value: unknown): value is AnswersState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((v) => typeof v === "string" || typeof v === "number");
}

export function loadWizard(): SavedWizard | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<SavedWizard>;
    if (!isValidPath(data.nodeIds) || !isValidAnswers(data.answers)) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { nodeIds: data.nodeIds, answers: data.answers };
  } catch {
    return null;
  }
}

export function saveWizard(nodeIds: string[], answers: AnswersState): void {
  try {
    // Пустую анкету (только стартовый экран) не храним.
    if (nodeIds.length <= 1 && Object.keys(answers).length === 0) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ nodeIds, answers }));
  } catch {
    // хранилище недоступно (приватный режим, запрет) — анкета просто работает без сохранения
  }
}

export function clearWizard(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
