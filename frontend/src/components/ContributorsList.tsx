import type { Contributor } from "../types";
import { Users } from "lucide-react";

interface ContributorsListProps {
  contributors: Contributor[];
  loading: boolean;
}

export default function ContributorsList({ contributors, loading }: ContributorsListProps) {
  if (loading) {
    return (
      <div className="panel" aria-busy="true" aria-label="Loading contributors">
        <div className="panel-heading">
          <span className="panel-title">Top contributors</span>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < 2 ? "1px solid var(--color-border)" : "none" }}>
            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "50%" }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-text" style={{ width: "60%" }} />
              <div className="skeleton skeleton-text" style={{ width: "40%" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (contributors.length === 0) {
    return (
      <div className="panel">
        <div className="panel-heading">
          <span className="panel-title">Top contributors</span>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="empty-state-title">No contributors available</div>
          <div>We couldn't retrieve the repository's contributors.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-heading">
        <span className="panel-title">Top contributors</span>
        <span className="panel-meta">{contributors.length} shown</span>
      </div>
      <div>
        {contributors.map((contributor) => (
          <div key={contributor.login} className="contributor-item">
            <div className="contributor-avatar">
              {contributor.avatarUrl ? (
                <img
                  src={contributor.avatarUrl}
                  alt={`${contributor.login} avatar`}
                  loading="lazy"
                />
              ) : (
                <Users size={18} color="var(--color-text-muted)" />
              )}
            </div>
            <div className="contributor-info">
              <div className="contributor-name">
                <a
                  href={`https://github.com/${contributor.login}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--color-accent)", textDecoration: "none" }}
                >
                  @{contributor.login}
                </a>
              </div>
              <div className="contributor-contributions">
                {contributor.contributions.toLocaleString()} contributions
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
