import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";

// Point the service at a throwaway database file before it is imported, so the
// dev database is never touched by tests.
const tmpDb = path.join(os.tmpdir(), `devpulse-test-${process.pid}.db`);
process.env.DEVPULSE_DB_PATH = tmpDb;

after(() => {
  try {
    fs.rmSync(tmpDb, { force: true });
  } catch {
    // Best-effort cleanup; a leftover temp file is harmless.
  }
});

const sample = {
  repoUrl: "https://github.com/test-owner/test-repo",
  owner: "test-owner",
  repo: "test-repo",
  title: "test-repo",
  description: "A repository created by the DevPulse test suite",
  language: "TypeScript",
  stars: 1234,
  forks: 56,
  openIssues: 7,
  lastCommit: "2026-01-01T00:00:00Z",
};

test("saveAnalysis persists a row and getHistory returns it newest-first", async () => {
  const db = await import("./database");
  const saved = await db.saveAnalysis(sample);
  assert.ok(saved.id > 0, "saved entry should have a positive id");
  assert.equal(saved.repoUrl, sample.repoUrl);
  assert.equal(saved.owner, sample.owner);
  assert.equal(saved.stars, sample.stars);
  assert.equal(saved.language, sample.language);

  const history = await db.getHistory();
  const match = history.find((e) => e.id === saved.id);
  assert.ok(match, "saved entry should appear in history");
  assert.equal(match.description, sample.description);
});

test("saving the same repoUrl again upserts instead of duplicating", async () => {
  const db = await import("./database");
  const first = await db.saveAnalysis(sample);
  const second = await db.saveAnalysis({ ...sample, stars: 9999, forks: 100 });
  assert.equal(second.id, first.id, "upsert should reuse the existing row id");
  assert.equal(second.stars, 9999);

  const history = await db.getHistory();
  const matches = history.filter((e) => e.repoUrl === sample.repoUrl);
  assert.equal(matches.length, 1, "there should be exactly one row per repoUrl");
});

test("deleteHistoryEntry removes the row and reports false on a second delete", async () => {
  const db = await import("./database");
  const saved = await db.saveAnalysis(sample);
  const first = await db.deleteHistoryEntry(saved.id);
  assert.equal(first, true);
  const second = await db.deleteHistoryEntry(saved.id);
  assert.equal(second, false);

  const history = await db.getHistory();
  assert.ok(
    history.every((e) => e.id !== saved.id),
    "deleted entry must not reappear in history",
  );
});
