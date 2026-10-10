import type { Commit } from "../types";
import { GitCommit } from "lucide-react";
import { mapJitter } from "../utils/commitUtils";

interface CommitsListProps {
  commits: Commit[];
  loading: boolean;
}

function timeAgo(iso: string): string {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < week) return `${Math.floor(diff / day)}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function CommitsList({ commits, loading }: CommitsListProps) {
  if (loading) {
    return (
      <div className="panel" aria-busy="true" aria-label="Loading recent commits">
        <div className="panel-heading">
          <span className="panel-title">Recent commits</span>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ borderBottom: i < 3 ? "1px solid var(--color-border)" : "none", paddingBottom: i < 3 ? 12 : 0 }}>
            <div className="skeleton" style={{ width: 80, height: 16, borderRadius: 4, marginBottom: 6 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <div className="skeleton" style={{ width: "75%", height: 16, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: 80, height: 14, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="panel">
        <div className="panel-heading">
          <span className="panel-title">Recent commits</span>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <div className="empty-state-title">No commits available</div>
          <div>We couldn't retrieve the recent commits for this repository.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-heading">
        <span className="panel-title">Recent commits</span>
        <span className="panel-meta">{commits.length} most recent</span>
      </div>
      <div>
        {commits.map((commit) => (
          <div key={commit.sha} className="commit-item">
            <span className="commit-sha" title={commit.sha}>
              {commit.sha}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="commit-message">
                {mapJitter(commit.message, 3) || "No commit message"}
              </div>
              <div className="commit-meta">
                <GitCommit size={11} aria-hidden="true" style={{ marginRight: 4, verticalAlign: "middle" }} />
                {commit.author} &middot; {timeAgo(commit.date)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
