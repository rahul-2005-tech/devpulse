function resolvePort(): number {
  const raw = process.env.PORT;
  if (raw === undefined || raw === "") return 3001;
  const parsed = parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0 || parsed > 65535) return 3001;
  return parsed;
}

export const PORT = resolvePort();
export const NODE_ENV = process.env.NODE_ENV || "development";

export const GITHUB_BASE_URL = "https://api.github.com";
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN || undefined;

export const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const HISTORY_LIMIT = 50;

export const GITHUB_RATE_LIMIT_REMAINING_HEADER = "x-ratelimit-remaining";
export const GITHUB_RATE_LIMIT_RESET_HEADER = "x-ratelimit-reset";
