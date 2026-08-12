/**
 * Подписи и форматирование полей анкеты для формирования отчёта.
 * Ключи полей синхронизированы с client/src/data/questionnaire.ts —
 * при изменении структуры анкеты на фронтенде обновите оба файла.
 */

export const FIELD_LABELS: Record<string, string> = {
  clientType: "Тип клиента",
  age: "Возраст",
  hasBankruptcy: "Процедура банкротства физлиц",
  bankruptcyTermPassed: "Срок с момента завершения процедуры БФЛ",
  registrationCity: "Город проживания по прописке",
  hasCurrentOverdue: "Действующая просроченная задолженность",
  hadOverdue12m: "Просрочка за последние 12 месяцев",
  isEmployed: "Официальное трудоустройство",
  officialIncome: "Официальный ежемесячный доход",
  hasUnofficialIncome: "Неофициальный заработок",
  unofficialIncome: "Сумма неофициального заработка",
  usesMFO: "Пользуется услугами МФО",
  hasActiveLoans: "Действующие кредиты",
  loanBalance: "Остаток задолженности",
  monthlyPayments: "Платежи в месяц по кредитам",
  biggestPaidLoan: "Крупнейший выплаченный кредит",
  hasProperty: "Недвижимость в собственности",
  isSoleOwner: "Единственный собственник",
  isPledged: "Недвижимость в залоге у банка",
  hasMinorOwners: "Несовершеннолетние собственники в долях",
  hasArrest: "Арест на регистрационные действия",
  closeRelativesPledgeConsent: "Готовность близких дать залог",
  hasCar: "Автомобиль в собственности",
  loanAmount: "Интересующая сумма кредита",
  loanPurpose: "Цель кредитования",
  ipOpenDate: "Дата открытия ИП",
  ipConsentToIndividual: "Согласие на рассмотрение как физлицо",
  ipTurnover: "Оборот по счету в месяц",
  netProfit: "Чистая прибыль в месяц",
  inn: "ИНН",
  llcOpenDate: "Дата регистрации ООО",
  llcConsentToCollateral: "Согласие на кредитование под залог",
  orgTurnover: "Оборот по счету в месяц",
  name: "Имя",
  contactInfo: "Контакт для связи",
};

/** Порядок полей при выводе полной анкеты в отчёте. */
export const FIELD_ORDER: string[] = [
  "clientType",
  "age",
  "hasBankruptcy",
  "bankruptcyTermPassed",
  "registrationCity",
  "ipOpenDate",
  "ipConsentToIndividual",
  "ipTurnover",
  "netProfit",
  "inn",
  "llcOpenDate",
  "llcConsentToCollateral",
  "orgTurnover",
  "hasCurrentOverdue",
  "hadOverdue12m",
  "isEmployed",
  "officialIncome",
  "hasUnofficialIncome",
  "unofficialIncome",
  "usesMFO",
  "hasActiveLoans",
  "loanBalance",
  "monthlyPayments",
  "biggestPaidLoan",
  "hasProperty",
  "isSoleOwner",
  "isPledged",
  "hasMinorOwners",
  "hasArrest",
  "closeRelativesPledgeConsent",
  "hasCar",
  "loanAmount",
  "loanPurpose",
];

const YES_NO_VALUES: Record<string, string> = {
  yes: "Да",
  no: "Нет",
};

const CLIENT_TYPE_VALUES: Record<string, string> = {
  individual: "Физлицо",
  entrepreneur: "ИП",
  legal_entity: "ООО",
};

const PROPERTY_VALUES: Record<string, string> = {
  owns: "Да, у меня есть",
  relatives: "У меня нет, но у близких есть",
  no: "Нет",
};

const PLEDGE_CONSENT_VALUES: Record<string, string> = {
  yes: "Да",
  maybe: "Возможно",
  no: "Нет",
};

const MONEY_FIELDS = new Set([
  "officialIncome",
  "unofficialIncome",
  "loanBalance",
  "monthlyPayments",
  "biggestPaidLoan",
  "loanAmount",
  "ipTurnover",
  "orgTurnover",
  "netProfit",
]);

const BOOLEAN_FIELDS = new Set([
  "hasBankruptcy",
  "hasCurrentOverdue",
  "hadOverdue12m",
  "isEmployed",
  "hasUnofficialIncome",
  "usesMFO",
  "hasActiveLoans",
  "isSoleOwner",
  "isPledged",
  "hasMinorOwners",
  "hasArrest",
  "hasCar",
  "ipConsentToIndividual",
  "llcConsentToCollateral",
]);

const DATE_FIELDS = new Set(["ipOpenDate", "llcOpenDate"]);

function formatMoney(value: unknown): string {
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  return `${new Intl.NumberFormat("ru-RU").format(num)} ₽`;
}

function formatDate(value: unknown): string {
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "long" }).format(date);
}

/** Приводит "сырое" значение поля к человекочитаемому виду для отчёта. */
export function formatFieldValue(field: string, value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";

  if (field === "clientType") return CLIENT_TYPE_VALUES[String(value)] ?? String(value);
  if (field === "hasProperty") return PROPERTY_VALUES[String(value)] ?? String(value);
  if (field === "closeRelativesPledgeConsent") return PLEDGE_CONSENT_VALUES[String(value)] ?? String(value);
  if (BOOLEAN_FIELDS.has(field)) return YES_NO_VALUES[String(value)] ?? String(value);
  if (MONEY_FIELDS.has(field)) return formatMoney(value);
  if (DATE_FIELDS.has(field)) return formatDate(value);
  if (field === "age") return `${value} лет`;

  return String(value);
}
