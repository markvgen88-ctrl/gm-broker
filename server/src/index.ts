import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { submitRouter } from "./routes/submit.js";
import { adminRouter } from "./routes/admin.js";
import { ensureSchema } from "./db/schema.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const ALLOWED_ORIGIN = process.env.CLIENT_ORIGIN ?? "*";
app.set("trust proxy", 1);

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    // credentials: true нужен для сессионной куки CRM (/admin). Если сайт
    // и API на одном домене (стандартный вариант деплоя на Timeweb) — этот
    // блок не имеет значения, всё и так same-origin. Если фронтенд и API на
    // разных доменах, CLIENT_ORIGIN обязательно должен быть конкретным
    // доменом, а не "*" — иначе браузер не отдаст куку авторизации.
    origin: ALLOWED_ORIGIN === "*" ? true : ALLOWED_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "gm-broker-server", time: new Date().toISOString() });
});

app.use("/api", submitRouter);
app.use("/api/admin", adminRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[server] Unhandled error:", err);
  res.status(500).json({ success: false, message: "Внутренняя ошибка сервера" });
});

app.listen(PORT, async () => {
  console.log(`G.M. Broker API listening on http://localhost:${PORT}`);
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.warn("⚠️  TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы — отправка в Telegram не будет работать.");
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("⚠️  SMTP не настроен — отправка на почту не будет работать.");
  }
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    console.warn("⚠️  ADMIN_PASSWORD / ADMIN_SESSION_SECRET не заданы — вход в /admin не будет работать.");
  }
  await ensureSchema();
});
