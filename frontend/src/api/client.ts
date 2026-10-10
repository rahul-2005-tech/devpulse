import axios from "axios";
import type { SearchResult, HistoryEntry, ApiError } from "../types";

const api = axios.create({
  baseURL: "/api",
  timeout: 20000,
  headers: {
    Accept: "application/json",
  },
});

export async function searchRepo(repoUrl: string): Promise<SearchResult> {
  const response = await api.post<SearchResult>("/search", { repoUrl });
  return response.data;
}

export async function fetchHistory(): Promise<HistoryEntry[]> {
  const response = await api.get<HistoryEntry[]>("/history");
  return response.data;
}

export async function deleteHistoryEntry(id: number): Promise<void> {
  await api.delete(`/history/${id}`);
}

export function isApiError(value: unknown): value is ApiError {
  if (value && typeof value === "object" && "error" in value) {
    return true;
  }
  return false;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function searchRepoSafe(repoUrl: string): Promise<SearchResult> {
  try {
    return await searchRepo(repoUrl);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const data = err.response?.data;
      if (data && typeof data === "object" && "error" in data) {
        throw new ApiRequestError(
          (data as ApiError).error as string,
          status,
          (data as ApiError).details,
        );
      }
      if (status === 400) {
        throw new ApiRequestError("Invalid repository URL. Please check the URL and try again.", status);
      }
      if (status === 404) {
        throw new ApiRequestError("We couldn't find that repository. Check the URL and try again.", status);
      }
      if (status === 429) {
        throw new ApiRequestError(
          "GitHub API rate limit reached. Try again later, or add a GitHub token in the backend .env.",
          status,
        );
      }
      const message = status && status >= 500
        ? "Something went wrong on the server. Please try again."
        : "Request failed.";
      throw new ApiRequestError(message, status);
    }
    throw new ApiRequestError("An unexpected error occurred.");
  }
}
