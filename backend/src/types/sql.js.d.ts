// sql.js ships only JS (no @types/sql.js). This ambient declaration lets the backend
// compile without reaching for a non-existent package. The runtime shape is verified
// by a require() smoke test during installation.

declare module "sql.js" {
  function initSqlJs(options?: { locateFile?: (file: string) => string }): Promise<SqlJsModule>;
  export default initSqlJs;
}

interface SqlJsModule {
  Database: new (data?: ArrayBuffer | Buffer | Uint8Array | string) => SqlJsDatabase;
}

interface SqlJsStmt {
  bind(params?: unknown[]): void;
  step(): boolean;
  getAsObject(): Record<string, unknown>;
  free(): void;
}

interface SqlJsDatabase {
  run(sql: string, params?: unknown[]): void;
  exec(sql: string, params?: unknown[]): { values?: unknown[][] }[];
  prepare(sql: string): SqlJsStmt;
  export(): ArrayBuffer;
}
