import { pool } from "./pool.js";

/** Настройки опроса на сайте, редактируются в CRM («Настройки опроса»). */
export interface SurveySettings {
  /** Минимальная сумма кредита, ₽. 0 — без ограничения. */
  minLoanAmount: number;
}

export const DEFAULT_SURVEY_SETTINGS: SurveySettings = {
  minLoanAmount: 1_000_000,
};

export const MAX_LOAN_AMOUNT_SETTING = 1_000_000_000;

export async function getSurveySettings(): Promise<SurveySettings> {
  const result = await pool.query<{ key: string; value: string }>(`SELECT key, value FROM survey_settings`);
  const settings: SurveySettings = { ...DEFAULT_SURVEY_SETTINGS };
  for (const row of result.rows) {
    if (row.key === "minLoanAmount") {
      const n = Number(row.value);
      if (Number.isInteger(n) && n >= 0 && n <= MAX_LOAN_AMOUNT_SETTING) settings.minLoanAmount = n;
    }
  }
  return settings;
}

export async function setMinLoanAmount(value: number): Promise<void> {
  await pool.query(
    `INSERT INTO survey_settings (key, value) VALUES ('minLoanAmount', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [String(value)]
  );
}
