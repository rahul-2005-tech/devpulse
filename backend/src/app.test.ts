import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "http";
import { createApp } from "./app";

let server: Server;
let baseUrl: string;

before(async () => {
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind an ephemeral port for tests");
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => {
  server?.close();
});

test("GET /api/health returns ok", async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const body = (await res.json()) as { status: string; timestamp: string };
  assert.equal(body.status, "ok");
  assert.ok(body.timestamp, "health payload should include a timestamp");
});

test("POST /api/search rejects a missing repoUrl with 400", async () => {
  const res = await fetch(`${baseUrl}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
  const body = (await res.json()) as {
    error: string;
    details?: Array<{ field: string; message: string }>;
  };
  assert.equal(body.error, "Validation failed");
  assert.ok(Array.isArray(body.details) && body.details.length > 0);
  assert.equal(body.details?.[0]?.field, "repoUrl");
});

test("POST /api/search rejects a non-URL string with 400 and a helpful message", async () => {
  const res = await fetch(`${baseUrl}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoUrl: "not-a-url" }),
  });
  assert.equal(res.status, 400);
  const body = (await res.json()) as { details?: Array<{ message: string }> };
  const message = body.details?.[0]?.message ?? "";
  assert.match(message, /github\.com/);
});

test("POST /api/search rejects non-GitHub URLs with 400", async () => {
  const res = await fetch(`${baseUrl}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoUrl: "https://example.com/some/repo" }),
  });
  assert.equal(res.status, 400);
});

test("POST /api/search rejects GitHub URLs missing a repo segment with 400", async () => {
  const res = await fetch(`${baseUrl}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoUrl: "https://github.com/orphanowner" }),
  });
  assert.equal(res.status, 400);
});

test("GET /api/history returns an array of saved analyses", async () => {
  const res = await fetch(`${baseUrl}/api/history`);
  assert.equal(res.status, 200);
  const body = (await res.json()) as unknown[];
  assert.ok(Array.isArray(body));
  for (const entry of body) {
    assert.ok(
      entry && typeof entry === "object" && "repoUrl" in entry && "analyzedAt" in entry,
      "every history entry should carry repoUrl and analyzedAt",
    );
  }
});

test("DELETE /api/history/abc returns 400 for a non-numeric id", async () => {
  const res = await fetch(`${baseUrl}/api/history/abc`, { method: "DELETE" });
  assert.equal(res.status, 400);
  const body = (await res.json()) as { error: string };
  assert.match(body.error, /Invalid history entry ID/);
});

test("DELETE /api/history/:id returns structured 404 for a missing entry", async () => {
  const res = await fetch(`${baseUrl}/api/history/999999`, { method: "DELETE" });
  assert.equal(res.status, 404);
  const body = (await res.json()) as { error: string };
  assert.match(body.error, /History entry not found/);
});

// Regression guard for the Express 4 + async handlers crash: an AppError thrown
// inside an async route handler must reach the error middleware (404 response)
// instead of becoming an unhandled rejection that kills the process.
test("server stays healthy after async error responses", async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
});

test("unknown API routes return JSON 404", async () => {
  const res = await fetch(`${baseUrl}/api/does-not-exist`);
  assert.equal(res.status, 404);
  const body = (await res.json()) as { error: string };
  assert.equal(body.error, "Not found");
});
