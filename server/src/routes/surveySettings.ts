import { Router } from "express";
import type { Request, Response } from "express";
import { DEFAULT_SURVEY_SETTINGS, getSurveySettings } from "../db/surveySettings.js";

export const surveySettingsRouter = Router();

/**
 * Публичные настройки опроса (сейчас — минимальная сумма кредита): сайт читает их
 * при открытии анкеты. Если база недоступна, отдаём значения по умолчанию, чтобы
 * анкета продолжала работать.
 */
surveySettingsRouter.get("/survey-settings", async (_req: Request, res: Response) => {
  res.set("Cache-Control", "no-store");
  try {
    res.json({ success: true, settings: await getSurveySettings() });
  } catch (err) {
    console.error("[survey-settings] Не удалось прочитать настройки, отдаём значения по умолчанию:", err);
    res.json({ success: true, settings: DEFAULT_SURVEY_SETTINGS });
  }
});
