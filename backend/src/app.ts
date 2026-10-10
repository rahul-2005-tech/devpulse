import express, { Express } from "express";
import cors from "cors";
import { NODE_ENV } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import searchRouter from "./routes/search";
import historyRouter from "./routes/history";

// Builds the Express application without binding a port, so tests can mount it
// on an ephemeral port while index.ts stays responsible for listening.
export function createApp(): Express {
  const app = express();

  app.set("trust proxy", NODE_ENV === "production");
  app.use(express.json({ limit: "1mb" }));

  app.use(
    cors({
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Accept"],
    }),
  );

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/search", searchRouter);
  app.use("/api/history", historyRouter);

  // 404 for undefined routes
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
