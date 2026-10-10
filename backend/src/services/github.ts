import axios from "axios";
import { GITHUB_BASE_URL, GITHUB_TOKEN, CACHE_TTL_MS } from "../config";
import type { RawGitHubRepo, LanguageBreakdown, Commit, Contributor } from "../types";

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(endpoint: string, params: Record<string, string | number>): string {
  const sorted = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return `${endpoint}?${sorted}`;
}

function getCached(key: string): unknown | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.data;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function headers() {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "DevPulse-Dashboard",
  };
  if (GITHUB_TOKEN) {
    h.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }
  return h;
}

function parseGitHubUrl(repoUrl: string): { owner: string; repo: string } | null {
  const cleaned = repoUrl.trim();
  const match = cleaned.match(
    /^https?:\/\/(www\.)?github\.com\/([^\/]+)\/([^\/\?#]+)(\/?$|$)/i,
  );
  if (!match) return null;
  const [, , owner, repo] = match;
  if (!owner || !repo) return null;
  return { owner, repo };
}

export interface ParsedRepoUrl {
  owner: string;
  repo: string;
}

export function parseRepoUrl(repoUrl: string): ParsedRepoUrl | null {
  return parseGitHubUrl(repoUrl) ?? null;
}

interface CachedResult<T> {
  data: T;
  cached: boolean;
}

export async function fetchRepoInfo(owner: string, repo: string): Promise<CachedResult<RawGitHubRepo>> {
  const key = cacheKey("/repos/{owner}/{repo}", { owner, repo }).replace(
    "{owner}",
    owner,
  ).replace("{repo}", repo);

  const cached = getCached(key) as RawGitHubRepo | undefined;
  if (cached) return { data: cached, cached: true };

  const response = await axios.get<RawGitHubRepo>(`${GITHUB_BASE_URL}/repos/${owner}/${repo}`, {
    headers: headers(),
    timeout: 15000,
  });

  setCache(key, response.data);
  return { data: response.data, cached: false };
}

export async function fetchLanguages(owner: string, repo: string): Promise<CachedResult<LanguageBreakdown>> {
  const key = cacheKey("/repos/{owner}/{repo}/languages", { owner, repo })
    .replace("{owner}", owner)
    .replace("{repo}", repo);

  const cached = getCached(key) as LanguageBreakdown | undefined;
  if (cached) return { data: cached, cached: true };

  const response = await axios.get<LanguageBreakdown>(
    `${GITHUB_BASE_URL}/repos/${owner}/${repo}/languages`,
    { headers: headers(), timeout: 15000 },
  );

  setCache(key, response.data);
  return { data: response.data, cached: false };
}

interface GitHubCommitRaw {
  sha?: string;
  commit?: {
    message?: string;
    author?: { name?: string; date?: string };
    committer?: { name?: string; date?: string };
  };
  html_url?: string;
}

interface GitHubContributorRaw {
  login?: string;
  avatar_url?: string;
  contributions?: number;
}

export async function fetchCommits(owner: string, repo: string): Promise<CachedResult<Commit[]>> {
  const key = cacheKey("/repos/{owner}/{repo}/commits", { owner, repo, per_page: 10 })
    .replace("{owner}", owner)
    .replace("{repo}", repo);

  const cached = getCached(key) as Commit[] | undefined;
  if (cached) return { data: cached, cached: true };

  const response = await axios.get<GitHubCommitRaw[]>(
    `${GITHUB_BASE_URL}/repos/${owner}/${repo}/commits?per_page=10&sort=committer-date&direction=desc`,
    { headers: headers(), timeout: 15000 },
  );

  const mapped: Commit[] = response.data
    .map((c) => ({
      sha: c.sha?.slice(0, 7) ?? "",
      message: c.commit?.message ?? "",
      author: c.commit?.author?.name ?? c.commit?.committer?.name ?? "unknown",
      date: c.commit?.committer?.date ?? c.commit?.author?.date ?? "",
      url: c.html_url ?? "",
    }))
    .filter((c) => c.sha !== "");

  setCache(key, mapped);
  return { data: mapped, cached: false };
}

export async function fetchContributors(owner: string, repo: string): Promise<CachedResult<Contributor[]>> {
  const key = cacheKey("/repos/{owner}/{repo}/contributors", { owner, repo, per_page: 10 })
    .replace("{owner}", owner)
    .replace("{repo}", repo);

  const cached = getCached(key) as Contributor[] | undefined;
  if (cached) return { data: cached, cached: true };

  const response = await axios.get<GitHubContributorRaw[]>(
    `${GITHUB_BASE_URL}/repos/${owner}/${repo}/contributors?per_page=10&anon=false`,
    { headers: headers(), timeout: 15000 },
  );

  const mapped: Contributor[] = response.data
    .map((c) => ({
      login: c.login ?? "unknown",
      avatarUrl: c.avatar_url ?? "",
      contributions: c.contributions ?? 0,
    }))
    .filter((c) => c.login && c.login !== "unknown");

  setCache(key, mapped);
  return { data: mapped, cached: false };
}

export interface RateLimitInfo {
  remaining: number | null;
  resetAt: string | null;
}

export function parseRateLimitInfo(headers: Record<string, string>): RateLimitInfo {
  const remaining = headers["x-ratelimit-remaining"];
  const reset = headers["x-ratelimit-reset"];
  return {
    remaining: remaining ? parseInt(remaining, 10) : null,
    resetAt: reset ? new Date(parseInt(reset, 10) * 1000).toISOString() : null,
  };
}
