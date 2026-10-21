import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./context";
import { loadEnv } from "./env";
import { MAX_ENCODED_REQUEST_BYTES } from "../shared/entitlements";

const env = loadEnv();
const app = express();

const ALLOWED_ORIGINS = new Set(
  ["http://localhost:8081", "http://localhost:3000", "http://127.0.0.1:8081", env.FRONTEND_URL].filter(
    (origin): origin is string => Boolean(origin),
  ),
);

// CORS for known origins only. No cookies or auth headers are used.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Accept");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: MAX_ENCODED_REQUEST_BYTES }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

app.listen(env.PORT, () => {
  console.log(`[api] server listening on port ${env.PORT}`);
});
