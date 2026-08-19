/**
 * Сценарий опроса для мастера "Заполнить договор" в CRM. Раньше эти же
 * вопросы задавал отдельный Telegram-бот на другом сервере — теперь тот же
 * порядок полей вынесен сюда одним файлом, а сам мастер (ContractWizardModal)
 * просто проходит по этому списку шаг за шагом.
 *
 * Порядок и состав полей синхронизированы вручную с бэкендом
 * (server/src/lib/contractValidation.ts, server/src/lib/contractTemplate.ts) —
 * при изменении сценария обновите оба места.
 */

export type ContractClientType = "ФЛ" | "ИП" | "ООО";

export const CONTRACT_CLIENT_TYPES: { value: ContractClientType; label: string }[] = [
  { value: "ФЛ", label: "Физическое лицо" },
  { value: "ИП", label: "ИП" },
  { value: "ООО", label: "ООО" },
];

export interface ContractFieldDef {
  key: string;
  label: string;
  placeholder?: string;
  /** Формат ввода — влияет только на плейсхолдер/маску, хранится всё равно строкой. */
  kind?: "text" | "date";
  pattern?: RegExp;
  patternMessage?: string;
}

const DATE_PATTERN = /^\d{2}\.\d{2}\.\d{4}$/;
const DATE_MESSAGE = "Формат: ДД.ММ.ГГГГ, например 14.10.1985";

const FL_FIELDS: ContractFieldDef[] = [
  { key: "name", label: "ФИО заказчика (полностью)" },
  { key: "address", label: "Адрес места жительства" },
  { key: "passport_series", label: "Серия паспорта", placeholder: "4 цифры", pattern: /^\d{4}$/, patternMessage: "4 цифры" },
  { key: "passport_num", label: "Номер паспорта", placeholder: "6 цифр", pattern: /^\d{6}$/, patternMessage: "6 цифр" },
  { key: "passport_date", label: "Дата выдачи паспорта", kind: "date", pattern: DATE_PATTERN, patternMessage: DATE_MESSAGE },
  { key: "passport_issued", label: "Кем выдан паспорт" },
  { key: "birthdate", label: "Дата рождения", kind: "date", pattern: DATE_PATTERN, patternMessage: DATE_MESSAGE },
  { key: "account", label: "Номер счёта заказчика" },
  { key: "bank", label: "Название банка" },
  { key: "bik", label: "БИК банка" },
  { key: "korr", label: "Корреспондентский счёт банка" },
  { key: "phone", label: "Номер телефона заказчика" },
];

const IP_FIELDS: ContractFieldDef[] = [
  { key: "name", label: "ФИО индивидуального предпринимателя" },
  { key: "inn", label: "ИНН", pattern: /^\d{10,12}$/, patternMessage: "10–12 цифр" },
  { key: "address", label: "Адрес" },
  { key: "account", label: "Номер расчётного счёта" },
  { key: "bank", label: "Название банка" },
  { key: "bik", label: "БИК банка" },
  { key: "korr", label: "Корреспондентский счёт банка" },
  { key: "phone", label: "Номер телефона заказчика" },
];

const OOO_FIELDS: ContractFieldDef[] = [
  { key: "name", label: "Полное название ООО" },
  { key: "inn", label: "ИНН организации", pattern: /^\d{10}$/, patternMessage: "10 цифр" },
  { key: "kpp", label: "КПП организации", pattern: /^\d{9}$/, patternMessage: "9 цифр" },
  { key: "address", label: "Юридический адрес" },
  { key: "director", label: "ФИО директора", placeholder: "Генеральный директор ФИО" },
  { key: "account", label: "Номер расчётного счёта" },
  { key: "bank", label: "Название банка" },
  { key: "bik", label: "БИК банка" },
  { key: "korr", label: "Корреспондентский счёт банка" },
  { key: "phone", label: "Номер телефона заказчика" },
];

/** Общие поля — задаются последними, после реквизитов, для любого типа клиента. */
export const CONTRACT_COMMON_FIELDS: ContractFieldDef[] = [
  { key: "credit_sum", label: "Сумма кредита", placeholder: "например: 3 000 000" },
  { key: "reward_percent", label: "Процент вознаграждения", placeholder: "например: 14" },
];

export const CONTRACT_FIELDS_BY_TYPE: Record<ContractClientType, ContractFieldDef[]> = {
  ФЛ: FL_FIELDS,
  ИП: IP_FIELDS,
  ООО: OOO_FIELDS,
};

/** Полный список шагов (реквизиты типа клиента + общие поля) для мастера. */
export function getContractSteps(clientType: ContractClientType): ContractFieldDef[] {
  return [...CONTRACT_FIELDS_BY_TYPE[clientType], ...CONTRACT_COMMON_FIELDS];
}
