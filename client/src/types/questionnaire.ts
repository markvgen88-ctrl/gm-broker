/**
 * Типы для графа анкеты "Проверка шансов на кредит".
 * Граф построен на основе логической карты (XMind) со сценарием,
 * предоставленным клиентом. Каждый узел — это один шаг мастера.
 * Переходы между узлами зависят от выбранного варианта ответа (choice)
 * либо являются линейными (input). Узлы с kind "decline" — это тупиковые
 * (терминальные) экраны отказа: анкета на них не отправляется, шаг просто
 * сообщает клиенту, что сейчас помочь не можем, и предлагает начать заново.
 */

export type FieldKey =
  | "clientType"
  | "age"
  | "hasBankruptcy"
  | "bankruptcyTermPassed"
  | "registrationCity"
  | "hasCurrentOverdue"
  | "hadOverdue12m"
  | "isEmployed"
  | "officialIncome"
  | "hasUnofficialIncome"
  | "unofficialIncome"
  | "usesMFO"
  | "hasActiveLoans"
  | "loanBalance"
  | "monthlyPayments"
  | "biggestPaidLoan"
  | "hasProperty"
  | "isSoleOwner"
  | "isPledged"
  | "hasMinorOwners"
  | "hasArrest"
  | "closeRelativesPledgeConsent"
  | "hasCar"
  | "loanAmount"
  | "loanPurpose"
  | "ipOpenDate"
  | "ipConsentToIndividual"
  | "ipTurnover"
  | "netProfit"
  | "inn"
  | "llcOpenDate"
  | "llcConsentToCollateral"
  | "orgTurnover"
  | "name"
  | "phone"
  | "contactInfo";

export type AnswerValue = string | number;

export type AnswersState = Partial<Record<FieldKey, AnswerValue>>;

export interface ChoiceOption {
  label: string;
  value: string;
  next: string;
}

interface BaseNode {
  id: string;
  /** Основной текст вопроса, отображается как заголовок шага. */
  question: string;
  /** Дополнительное пояснение под заголовком (необязательно). */
  hint?: string;
  field: FieldKey;
}

export interface ChoiceNode extends BaseNode {
  kind: "choice";
  options: ChoiceOption[];
}

export interface InputNode extends BaseNode {
  kind: "input";
  inputType: "number" | "text" | "date";
  placeholder?: string;
  suffix?: string;
  min?: number;
  max?: number;
  /** Следующий узел в обычном сценарии. */
  next: string;
  /**
   * Условное ветвление по дате (используется для "Укажите дату открытия
   * ИП/ООО"). Если с указанной даты прошло МЕНЬШЕ minMonths полных месяцев —
   * переход на belowNext вместо next.
   */
  dateBranch?: {
    minMonths: number;
    belowNext: string;
  };
}

export interface FinalNode extends BaseNode {
  kind: "final";
}

/** Терминальный экран отказа — без поля и без перехода дальше. */
export interface DeclineNode {
  id: string;
  kind: "decline";
  /** Сообщение об отказе. */
  message: string;
  /** Рекомендация клиенту (необязательно). */
  hint?: string;
}

export type QuestionNode = ChoiceNode | InputNode | FinalNode | DeclineNode;

export type QuestionnaireGraph = Record<string, QuestionNode>;
