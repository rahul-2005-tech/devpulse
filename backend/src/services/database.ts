import path from "path";
import fs from "fs";
import type { HistoryEntry } from "../types";
import { HISTORY_LIMIT } from "../config";
import initSqlJs from "sql.js";

const DB_PATH = process.env.DEVPULSE_DB_PATH
  ? path.resolve(process.env.DEVPULSE_DB_PATH)
  : path.resolve(__dirname, "../../data/devpulse.db");

// sql.js needs to load its WebAssembly file at runtime. In a tsx/Node run the default
// location heuristic doesn't always work, so we point it at the wasm file shipped by
// the sql.js package.
function sqlJsInitOptions() {
  try {
    // __dirname is available because tsconfig uses module: "commonjs".
    const sqlJsWasmDir = path.dirname(require.resolve("sql.js/dist/sql-wasm.wasm"));
    return {
      locateFile: (file: string) => path.join(sqlJsWasmDir, file),
    };
  } catch {
    // Fall back to the package's dist directory if the exact wasm path isn't resolvable.
    const sqlJsDistDir = path.dirname(require.resolve("sql.js/dist/sql-wasm.js"));
    return {
      locateFile: (file: string) => path.join(sqlJsDistDir, file),
    };
  }
}

function loadSqlJs(): Promise<SqlJsDatabase> {
  return initSqlJs(sqlJsInitOptions()).then((SQL) => {
    const fileBuffer = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : undefined;
    return new SQL.Database(fileBuffer);
  });
}

let dbPromise: Promise<SqlJsDatabase> | null = null;
let db: SqlJsDatabase | null = null;

function ensureDir(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function getDb(): Promise<SqlJsDatabase> {
  if (db) return db;
  if (!dbPromise) {
    dbPromise = (async () => {
      ensureDir();
      const database = await loadSqlJs();
      db = database;
      dbPromise = null;
      initSchema(database);
      return database;
    })();
  }
  return dbPromise;
}

function saveDb(database: SqlJsDatabase): void {
  ensureDir();
  const data = database.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function initSchema(database: SqlJsDatabase): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS analyses (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_url    TEXT    NOT NULL UNIQUE,
      owner       TEXT    NOT NULL,
      repo        TEXT    NOT NULL,
      title       TEXT,
      description TEXT,
      language    TEXT,
      stars       INTEGER DEFAULT 0,
      forks       INTEGER DEFAULT 0,
      open_issues INTEGER DEFAULT 0,
      last_commit TEXT,
      analyzed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export interface SaveAnalysisInput {
  repoUrl: string;
  owner: string;
  repo: string;
  title: string | null;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  lastCommit: string | null;
}

export async function saveAnalysis(input: SaveAnalysisInput): Promise<HistoryEntry> {
  const database = await getDb();
  // Upsert via INSERT ... ON CONFLICT DO UPDATE.
  database.run(`
    INSERT INTO analyses (repo_url, owner, repo, title, description, language, stars, forks, open_issues, last_commit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(repo_url) DO UPDATE SET
      title       = excluded.title,
      description = excluded.description,
      language    = excluded.language,
      stars       = excluded.stars,
      forks       = excluded.forks,
      open_issues = excluded.open_issues,
      last_commit = excluded.last_commit,
      analyzed_at = CURRENT_TIMESTAMP
  `, [
    input.repoUrl,
    input.owner,
    input.repo,
    input.title,
    input.description,
    input.language,
    input.stars,
    input.forks,
    input.openIssues,
    input.lastCommit,
  ]);

  // Read back the affected row's id (inserted or updated).
  const execResult = database.exec(`SELECT id FROM analyses WHERE repo_url = ?`, [input.repoUrl]);
  const rowId = (execResult[0]?.values?.[0]?.[0] as number) ?? 0;
  saveDb(database);
  return getHistoryEntryById(rowId);
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const database = await getDb();
  const stmt = database.prepare(`
    SELECT id, repo_url AS repoUrl, owner, repo, title, description, language,
           stars, forks, open_issues AS openIssues, last_commit AS lastCommit, analyzed_at AS analyzedAt
    FROM analyses
    ORDER BY analyzed_at DESC
    LIMIT ?`);
  stmt.bind([HISTORY_LIMIT]);
  const results: HistoryEntry[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as unknown as HistoryEntry;
    results.push(row);
  }
  stmt.free();
  return results;
}

export async function deleteHistoryEntry(id: number): Promise<boolean> {
  const database = await getDb();
  database.run("DELETE FROM analyses WHERE id = ?", [id]);
  const execResult = database.exec("SELECT changes() AS changes");
  const deleted = (execResult[0]?.values?.[0]?.[0] as number) > 0;
  saveDb(database);
  return deleted;
}

async function getHistoryEntryById(id: number): Promise<HistoryEntry> {
  const database = await getDb();
  const stmt = database.prepare(`
    SELECT id, repo_url AS repoUrl, owner, repo, title, description, language,
           stars, forks, open_issues AS openIssues, last_commit AS lastCommit, analyzed_at AS analyzedAt
    FROM analyses
    WHERE id = ?`);
  stmt.bind([id]);
  let row: HistoryEntry | null = null;
  if (stmt.step()) {
    row = stmt.getAsObject() as unknown as HistoryEntry;
  }
  stmt.free();
  if (!row) {
    throw new Error(`History entry not found: ${id}`);
  }
  return row;
}
