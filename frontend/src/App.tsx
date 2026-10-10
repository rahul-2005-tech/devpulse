import { useState, useEffect, useCallback } from "react";
import SearchForm from "./components/SearchForm";
import RepoOverview from "./components/RepoOverview";
import LanguageChart from "./components/LanguageChart";
import CommitsList from "./components/CommitsList";
import ContributorsList from "./components/ContributorsList";
import HistoryPanel from "./components/HistoryPanel";
import { searchRepoSafe, fetchHistory, deleteHistoryEntry } from "./api/client";
import type { SearchResult, HistoryEntry } from "./types";
import { useToast } from "./hooks/useToast";
import { Github, Loader2, AlertCircle } from "lucide-react";

type AppView = "home" | "result";

export default function App() {
  const [view, setView] = useState<AppView>("home");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [reloadingId, setReloadingId] = useState<number | null>(null);
  const { toast, show } = useToast();

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const entries = await fetchHistory();
      setHistory(entries);
    } catch {
      // Non-fatal: keep any previously loaded history.
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleResult = useCallback(
    (searchResult: SearchResult) => {
      setResult(searchResult);
      setView("result");
      // Refresh history after a successful save on the backend.
      loadHistory();
      setSearching(false);
    },
    [loadHistory],
  );

  const startSearch = useCallback(() => {
    setSearching(true);
  }, []);

  const handleReload = useCallback(
    async (entry: HistoryEntry) => {
      setReloadingId(entry.id);
      try {
        const searchResult = await searchRepoSafe(entry.repoUrl);
        setResult(searchResult);
        setView("result");
        show(`Re-analyzed ${entry.owner}/${entry.repo}`);
      } catch (err) {
        if (err instanceof Error) {
          show(err.message, "error");
        } else {
          show("Failed to re-analyze the repository.", "error");
        }
      } finally {
        setReloadingId(null);
      }
    },
    [show],
  );

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteHistoryEntry(id);
        setHistory((prev) => prev.filter((e) => e.id !== id));
        show("Removed from history.");
      } catch {
        show("Failed to remove the entry.", "error");
      }
    },
    [show],
  );

  const handleBack = useCallback(() => {
    setView("home");
    setResult(null);
  }, []);

  return (
    <div className="wrapper">
      <header className="app-header">
        <div className="app-brand">
          <span className="app-brand-mark" aria-hidden="true">P</span>
          <div>
            <div className="app-brand-name">DevPulse</div>
            <div className="app-brand-sub">GitHub Repository Intelligence Dashboard</div>
          </div>
        </div>
        <div className="app-header-actions">
          {view === "result" ? (
            <button className="btn" onClick={handleBack} aria-label="Back to search">
              <Github size={15} aria-hidden="true" />
              New search
            </button>
          ) : (
            <span style={{ opacity: 0.6, fontStyle: "italic" }}>
              Powered by the public GitHub API (no account required)
            </span>
          )}
        </div>
      </header>

      {view === "home" ? (
        <>
          <SearchForm onResult={(r) => { startSearch(); handleResult(r); }} loading={searching} />

          <HistoryPanel
            entries={history}
            loading={loadingHistory}
            reloadingId={reloadingId}
            onReload={handleReload}
            onDelete={handleDelete}
          />
        </>
      ) : result ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <RepoOverview repo={result.repo} loading={searching} />

          <div className="grid-2">
            <LanguageChart languages={result.languages} loading={searching} />
          </div>

          <div className="grid-2">
            <CommitsList commits={result.commits} loading={searching} />
            <ContributorsList contributors={result.contributors} loading={searching} />
          </div>

          {result.cached && (
            <p className="search-hint" style={{ marginTop: 6 }}>
              This result was served from cache to be gentle on the GitHub API rate
              limit.
            </p>
          )}
        </div>
      ) : null}

      {toast && (
        <div className={`toast${toast.type === "error" ? " error" : ""}`} role="status">
          {toast.type === "error" ? (
            <>
              <AlertCircle size={16} aria-hidden="true" style={{ marginRight: 8, verticalAlign: "middle" }} />
              {toast.message}
            </>
          ) : (
            toast.message
          )}
        </div>
      )}

      {searching && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11, 15, 20, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 40,
          }}
          aria-busy="true"
          aria-label="Analyzing repository"
        >
          <div
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius)",
              padding: "24px 28px",
              display: "flex",
              gap: 14,
              alignItems: "center",
              boxShadow: "var(--shadow)",
            }}
          >
            <Loader2 size={22} className="loading-spinner" aria-hidden="true" />
            <span style={{ color: "var(--color-text)" }}>Analyzing repository…</span>
          </div>
        </div>
      )}
    </div>
  );
}
