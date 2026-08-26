import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { ContractInput } from "./contractValidation.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(__dirname, "../assets/template_with_placeholders.docx");

const MONTHS_RU = [
  "Января", "Февраля", "Марта", "Апреля", "Мая", "Июня",
  "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря",
] as const;

function makeDateLong(d: Date): string {
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]} ${d.getFullYear()}`;
}

function makeDateShort(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

/** "Иванов Иван Иванович" → "Иванов И.И." — как в исходном боте. */
function shortenName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 3) {
    return `${parts[0]} ${parts[1][0]}.${parts[2][0]}.`;
  }
  return fullName;
}

/** Собирает карту {{ПЛЕЙСХОЛДЕР}} → значение для одного договора. */
export function buildContractMapping(contractNum: number, input: ContractInput): Record<string, string> {
  const now = new Date();
  const { clientType, data } = input;
  const rawName = data.name;

  let fullName: string;
  let shortName: string;

  if (clientType === "ФЛ") {
    fullName = rawName;
    shortName = shortenName(rawName);
  } else if (clientType === "ИП") {
    fullName = `ИП ${rawName}`;
    shortName = `ИП ${shortenName(rawName)}`;
  } else {
    const director = "director" in data ? data.director : "";
    fullName = `${rawName} в лице Генерального директора ${director}`;
    shortName = shortenName(director);
  }

  const isFl = clientType === "ФЛ";

  return {
    CONTRACT_NUM: String(contractNum),
    DATE_LONG: makeDateLong(now),
    DATE_SHORT: makeDateShort(now),
    CLIENT_NAME: fullName,
    CLIENT_SHORT: shortName,
    CLIENT_ADDRESS: data.address,
    PASSPORT_SERIES: isFl && "passport_series" in data ? data.passport_series : "",
    PASSPORT_NUM: isFl && "passport_num" in data ? data.passport_num : "",
    PASSPORT_DATE: isFl && "passport_date" in data ? data.passport_date : "",
    PASSPORT_ISSUED: isFl && "passport_issued" in data ? data.passport_issued : "",
    CLIENT_BIRTHDATE: isFl && "birthdate" in data ? data.birthdate : "",
    CLIENT_ACCOUNT: data.account,
    CLIENT_BANK: data.bank,
    CLIENT_BIK: data.bik,
    CLIENT_KORR: data.korr,
    CLIENT_PHONE: data.phone,
    CREDIT_SUM: data.credit_sum,
    REWARD_PERCENT: data.reward_percent,
    // В текущем шаблоне таких плейсхолдеров нет (в старом боте эти данные
    // тоже никуда не подставлялись, только сохранялись в базе) — но если
    // {{CLIENT_INN}} / {{CLIENT_KPP}} когда-нибудь добавят в сам .docx,
    // значения начнут подставляться сами, без правок кода.
    CLIENT_INN: "inn" in data ? data.inn : "",
    CLIENT_KPP: "kpp" in data ? data.kpp : "",
  };
}

/** Заполняет шаблон и возвращает готовый .docx как Buffer. */
export function generateContractDocx(contractNum: number, input: ContractInput): Buffer {
  const content = fs.readFileSync(TEMPLATE_PATH, "binary");
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
  });

  doc.render(buildContractMapping(contractNum, input));

  return doc.getZip().generate({ type: "nodebuffer" });
}
