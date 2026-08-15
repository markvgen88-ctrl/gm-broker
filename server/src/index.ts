import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { submitRouter } from "./routes/submit.js";
import { adminRouter } from "./routes/admin.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const ALLOWED_ORIGIN = process.env.CLIENT_ORIGIN ?? "*";
app.set("trust proxy", 1);

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    // credentials: true нужен, чтобы браузер отправлял cookie сессии админки
    // (/admin) при запросах с фронтенда на другой домен/поддомен API.
    // Обязательно задайте конкретный CLIENT_ORIGIN в проде — "*" с credentials
    // браузеры не разрешают.
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

app.listen(PORT, () => {
  console.log(`G.M. Broker API listening on http://localhost:${PORT}`);
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.warn("⚠️  TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы — отправка в Telegram не будет работать.");
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("⚠️  SMTP не настроен — отправка на почту не будет работать.");
  }
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      "⚠️  ADMIN_PASSWORD не задан — для /admin действует запасной пароль 123456789 из кода (server/src/lib/auth.ts). Задайте свой пароль в .env и смените запасной."
    );
  }
});
