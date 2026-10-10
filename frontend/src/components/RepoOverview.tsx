import type { RepoInfo } from "../types";
import { Star, GitBranch, GitPullRequest, Calendar, ExternalLink } from "lucide-react";

interface RepoOverviewProps {
  repo: RepoInfo | null;
  loading: boolean;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.0+$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RepoOverview({ repo, loading }: RepoOverviewProps) {
  if (loading) {
    return (
      <div className="panel" aria-busy="true" aria-label="Loading repository overview">
        <div className="panel-heading">
          <span className="panel-title">Repository overview</span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div className="skeleton skeleton-avatar" />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="skeleton skeleton-text" style={{ width: "70%" }} />
            <div className="skeleton skeleton-text" />
            <div className="skeleton skeleton-text" style={{ width: "45%" }} />
          </div>
        </div>
        <div className="repo-stats" style={{ marginTop: 12 }}>
          <div className="skeleton" style={{ width: 90, height: 28, borderRadius: 20 }} />
          <div className="skeleton" style={{ width: 90, height: 28, borderRadius: 20 }} />
          <div className="skeleton" style={{ width: 90, height: 28, borderRadius: 20 }} />
        </div>
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="panel">
        <div className="panel-heading">
          <span className="panel-title">Repository overview</span>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
          </div>
          <div className="empty-state-title">No repository selected</div>
          <div>Paste a GitHub URL above to see the repository overview.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-heading">
        <span className="panel-title">Repository overview</span>
        <a
          href={repo.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          style={{ padding: "4px 10px", fontSize: "0.8rem" }}
        >
          <ExternalLink size={13} aria-hidden="true" />
          View on GitHub
        </a>
      </div>

      <div className="repo-header">
        <div className="repo-avatar">
          {repo.avatarUrl ? (
            <img src={repo.avatarUrl} alt={`${repo.name} owner avatar`} loading="lazy" />
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>
        <div>
          <div className="repo-title">
            <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer">
              {repo.name}
            </a>
          </div>
          {repo.description ? (
            <div className="repo-description">{repo.description}</div>
          ) : (
            <div className="repo-description" style={{ fontStyle: "italic" }}>
              No description provided.
            </div>
          )}
          <div className="repo-stats">
            <div className="repo-stat">
              <Star size={16} aria-hidden="true" />
              <span>
                <strong>{formatNumber(repo.stars)}</strong> stars
              </span>
            </div>
            <div className="repo-stat">
              <GitBranch size={16} aria-hidden="true" />
              <span>
                <strong>{formatNumber(repo.forks)}</strong> forks
              </span>
            </div>
            <div className="repo-stat">
              <GitPullRequest size={16} aria-hidden="true" />
              <span>
                <strong>{formatNumber(repo.openIssues)}</strong> open issues
              </span>
            </div>
            <div className="repo-stat">
              <Calendar size={16} aria-hidden="true" />
              <span>created {formatDate(repo.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <span className="stat-badge">
          {repo.language ? repo.language : "No primary language"}
        </span>
      </div>
    </div>
  );
}
