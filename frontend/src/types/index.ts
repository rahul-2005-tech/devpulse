export interface RepoInfo {
  id: number;
  url: string;
  name: string;
  title: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  avatarUrl: string | null;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface LanguageBreakdown {
  [language: string]: number;
}

export interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface Contributor {
  login: string;
  avatarUrl: string;
  contributions: number;
}

export interface SearchResult {
  repo: RepoInfo;
  languages: LanguageBreakdown;
  commits: Commit[];
  contributors: Contributor[];
  cached: boolean;
}

export interface HistoryEntry {
  id: number;
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
  analyzedAt: string;
}

export interface ApiError {
  error: string;
  details?: Array<{ field: string; message: string }>;
}

export type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: SearchResult }
  | { status: "error"; message: string };
