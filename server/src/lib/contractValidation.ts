import { z } from "zod";

// Общие для всех трёх типов клиента поля (банковские реквизиты + условия).
const requisites = {
  address: z.string().trim().min(1).max(300),
  account: z.string().trim().min(1).max(40),
  bank: z.string().trim().min(1).max(200),
  bik: z.string().trim().min(1).max(20),
  korr: z.string().trim().min(1).max(40),
  phone: z.string().trim().min(1).max(40),
  credit_sum: z.string().trim().min(1).max(50),
  reward_percent: z.string().trim().min(1).max(10),
};

const DATE_DDMMYYYY = /^\d{2}\.\d{2}\.\d{4}$/;

const flDataSchema = z.object({
  name: z.string().trim().min(2).max(200),
  address: requisites.address,
  passport_series: z.string().trim().regex(/^\d{4}$/, "Серия паспорта — 4 цифры"),
  passport_num: z.string().trim().regex(/^\d{6}$/, "Номер паспорта — 6 цифр"),
  passport_date: z.string().trim().regex(DATE_DDMMYYYY, "Формат: ДД.ММ.ГГГГ"),
  passport_issued: z.string().trim().min(1).max(300),
  birthdate: z.string().trim().regex(DATE_DDMMYYYY, "Формат: ДД.ММ.ГГГГ"),
  account: requisites.account,
  bank: requisites.bank,
  bik: requisites.bik,
  korr: requisites.korr,
  phone: requisites.phone,
  credit_sum: requisites.credit_sum,
  reward_percent: requisites.reward_percent,
});

const ipDataSchema = z.object({
  name: z.string().trim().min(2).max(200),
  inn: z.string().trim().regex(/^\d{10,12}$/, "ИНН — 10–12 цифр"),
  address: requisites.address,
  account: requisites.account,
  bank: requisites.bank,
  bik: requisites.bik,
  korr: requisites.korr,
  phone: requisites.phone,
  credit_sum: requisites.credit_sum,
  reward_percent: requisites.reward_percent,
});

const oooDataSchema = z.object({
  name: z.string().trim().min(2).max(300),
  inn: z.string().trim().regex(/^\d{10}$/, "ИНН организации — 10 цифр"),
  kpp: z.string().trim().regex(/^\d{9}$/, "КПП — 9 цифр"),
  address: requisites.address,
  director: z.string().trim().min(2).max(200),
  account: requisites.account,
  bank: requisites.bank,
  bik: requisites.bik,
  korr: requisites.korr,
  phone: requisites.phone,
  credit_sum: requisites.credit_sum,
  reward_percent: requisites.reward_percent,
});

export const contractInputSchema = z.discriminatedUnion("clientType", [
  z.object({ clientType: z.literal("ФЛ"), data: flDataSchema }),
  z.object({ clientType: z.literal("ИП"), data: ipDataSchema }),
  z.object({ clientType: z.literal("ООО"), data: oooDataSchema }),
]);

export type ContractInput = z.infer<typeof contractInputSchema>;
