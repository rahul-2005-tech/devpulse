import type { HistoryEntry } from "../types";
import { Clock, RefreshCw, Trash2, ExternalLink } from "lucide-react";

interface HistoryPanelProps {
  entries: HistoryEntry[];
  loading: boolean;
  reloadingId: number | null;
  onReload: (entry: HistoryEntry) => void;
  onDelete: (id: number) => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPanel({
  entries,
  loading,
  reloadingId,
  onReload,
  onDelete,
}: HistoryPanelProps) {
  if (loading) {
    return (
      <div className="panel" aria-busy="true" aria-label="Loading history">
        <div className="panel-heading">
          <span className="panel-title">Saved history</span>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="history-item" style={{ opacity: 0.6 }}>
            <div className="history-info">
              <div className="skeleton" style={{ width: 60, height: 20, borderRadius: 4 }} />
              <div className="skeleton" style={{ width: "100%", height: 16, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="panel">
        <div className="panel-heading">
          <span className="panel-title">Saved history</span>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">
            <Clock size={40} strokeWidth={1.5} />
          </div>
          <div className="empty-state-title">No saved analyses yet</div>
          <div>
            Analyze a repository and it will appear here so you can revisit it later.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-heading">
        <span className="panel-title">Saved history</span>
        <span className="panel-meta">{entries.length} stored</span>
      </div>
      <ul className="history-list">
        {entries.map((entry) => (
          <li key={entry.id} className="history-item">
            <div className="history-info">
              <a
                href={`https://github.com/${entry.owner}/${entry.repo}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {entry.owner}/{entry.repo}
              </a>
              <span className="history-meta">
                {entry.language ? `${entry.language}` : "no language"} &middot;{" "}
                {formatDate(entry.analyzedAt)}
              </span>
            </div>
            <div className="history-actions">
              <button
                className="btn"
                onClick={() => onReload(entry)}
                disabled={reloadingId === entry.id}
                title="Re-analyze this repository"
                aria-label={`Re-analyze ${entry.owner}/${entry.repo}`}
              >
                <RefreshCw size={14} aria-hidden="true" />
                {reloadingId === entry.id ? "…" : "Load"}
              </button>
              <a
                href={`https://github.com/${entry.owner}/${entry.repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                title="Open on GitHub"
                aria-label={`Open ${entry.owner}/${entry.repo} on GitHub`}
              >
                <ExternalLink size={14} aria-hidden="true" />
              </a>
              <button
                className="btn btn-danger"
                onClick={() => onDelete(entry.id)}
                disabled={reloadingId === entry.id}
                title="Remove from history"
                aria-label={`Remove ${entry.owner}/${entry.repo} from history`}
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
