import "dotenv/config";
import { PORT, NODE_ENV } from "./config";
import { createApp } from "./app";

const app = createApp();

const HOST = process.env.HOST || "127.0.0.1";
const server = app.listen(PORT, HOST, () => {
  console.log(`[backend] DevPulse backend running at http://${HOST}:${PORT}`);
  console.log(`[backend] Environment: ${NODE_ENV}`);
  if (!process.env.GITHUB_TOKEN) {
    console.log("[backend] No GITHUB_TOKEN set — using unauthenticated API (60 req/hr limit).");
  }
});

server.on("error", (err) => {
  console.error("[backend] Failed to start server:", err.message);
  process.exit(1);
});
