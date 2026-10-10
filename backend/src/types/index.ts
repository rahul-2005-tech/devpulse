// Shared types used by the backend API responses.
// These mirror what the frontend will expect.

export interface RepoInfo {
  id: number;
  url: string;
  name: string; // "owner/repo"
  title: string; // repo display name
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

// Shape of the raw GitHub API response for a repo.
// Kept internal to the service layer.
export interface RawGitHubRepo {
  id: number;
  url: string;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  owner: {
    avatar_url: string;
    login: string;
  };
  html_url: string;
  created_at: string;
  updated_at: string;
}
