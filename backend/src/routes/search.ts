import { Router, Request, Response } from "express";
import { z } from "zod";
import { validate, getValidatedBody } from "../middleware/validation";
import { AppError, asyncHandler } from "../middleware/errorHandler";
import { parseRepoUrl, fetchRepoInfo, fetchLanguages, fetchCommits, fetchContributors } from "../services/github";
import { saveAnalysis } from "../services/database";
import type { SearchResult, RepoInfo, Commit, Contributor } from "../types";

const router = Router();

const searchSchema = z.object({
  repoUrl: z
    .string()
    .trim()
    .min(1, "Repository URL is required")
    .refine(
      (value) => {
        const parsed = parseRepoUrl(value);
        return parsed !== null;
      },
      {
        message: "Enter a valid public GitHub repository URL (e.g. https://github.com/vercel/next.js)",
      },
    ),
});

export interface ValidatedSearchBody {
  repoUrl: string;
}

router.post("/", validate(searchSchema), asyncHandler(async (req: Request, res: Response) => {
  const body = getValidatedBody<ValidatedSearchBody>(req);
  const parsed = parseRepoUrl(body.repoUrl);
  if (!parsed) {
    // Should not reach here due to Zod refine, but keep as safety net.
    throw new AppError(400, "Invalid GitHub repository URL");
  }

  const { owner, repo } = parsed;

  try {
    const [repoResult, languagesResult, commitsResult, contributorsResult] = await Promise.all([
      fetchRepoInfo(owner, repo),
      fetchLanguages(owner, repo),
      fetchCommits(owner, repo),
      fetchContributors(owner, repo),
    ]);

    const repoData = repoResult.data;
    const languages = languagesResult.data;
    const commits = commitsResult.data;
    const contributors = contributorsResult.data;
    const cached = repoResult.cached || languagesResult.cached || commitsResult.cached || contributorsResult.cached;

    if (!repoData.full_name) {
      throw new AppError(404, `Repository not found: ${body.repoUrl}`);
    }

    const result: SearchResult = {
      repo: toRepoInfo(repoData, body.repoUrl),
      languages,
      commits,
      contributors,
      cached,
    };

    // Persist snapshot to SQLite history (idempotent upsert).
    await saveAnalysis({
      repoUrl: body.repoUrl,
      owner,
      repo,
      title: repoData.name || null,
      description: repoData.description,
      language: repoData.language,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssues: repoData.open_issues_count,
      lastCommit: commits.length > 0 ? commits[0].date : null,
    });

    res.json(result);
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err && typeof err === "object" && "response" in err) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr.response?.status === 404) {
        throw new AppError(404, `Repository not found: ${body.repoUrl}`);
      }
      if (axiosErr.response?.status === 403) {
        // GitHub can return 403 when rate limited.
        throw new AppError(429, "GitHub API rate limit reached. Try again later or add a GitHub token.");
      }
    }
    throw err;
  }
}));

function toRepoInfo(data: { full_name: string; description: string | null; language: string | null; stargazers_count: number; forks_count: number; open_issues_count: number; owner: { avatar_url: string; login: string }; html_url: string; created_at: string; updated_at: string }, repoUrl: string): RepoInfo {
  return {
    id: data.full_name.length,
    url: repoUrl,
    name: data.full_name,
    title: data.full_name,
    description: data.description,
    language: data.language,
    stars: data.stargazers_count,
    forks: data.forks_count,
    openIssues: data.open_issues_count,
    avatarUrl: data.owner.avatar_url ?? null,
    htmlUrl: data.html_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export default router;
