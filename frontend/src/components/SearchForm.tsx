import { useState, FormEvent } from "react";
import { searchRepoSafe } from "../api/client";
import type { SearchResult } from "../types";
import { Search, AlertCircle } from "lucide-react";

interface SearchFormProps {
  onResult: (result: SearchResult) => void;
  loading: boolean;
}

export default function SearchForm({ onResult, loading }: SearchFormProps) {
  const [query, setQuery] = useState("");
  const [inputError, setInputError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const normalizeUrl = (raw: string) => {
    let s = raw.trim();
    if (!s) return "";
    // Allow "github.com/owner/repo" without scheme; add https://
    if (!/^https?:\/\//i.test(s)) {
      s = `https://${s}`;
    }
    // Strip trailing slash
    s = s.replace(/\/+$/, "");
    return s;
  };

  const validate = (url: string): string => {
    if (!url) return "Please enter a GitHub repository URL.";
    const normalized = normalizeUrl(url);
    if (!/^https?:\/\/(www\.)?github\.com\/[^\/]+\/[^\/\?#]+$/i.test(normalized)) {
      return "Enter a valid GitHub repository URL (for example: https://github.com/vercel/next.js).";
    }
    return "";
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError("");
    const normalized = normalizeUrl(query);
    const validationError = validate(normalized);
    if (validationError) {
      setInputError(validationError);
      return;
    }
    setInputError("");
    setQuery(normalized);
    try {
      const result = await searchRepoSafe(normalized);
      onResult(result);
    } catch (err) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="search-card">
      <form onSubmit={handleSubmit} noValidate>
        <div className="search-row">
          <input
            className={`search-input${inputError ? " error" : ""}`}
            type="url"
            placeholder="https://github.com/vercel/next.js"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (inputError) setInputError("");
            }}
            disabled={loading}
            aria-label="GitHub repository URL"
          />            <button type="submit" className="btn btn-primary" disabled={loading || !query.trim()}>
            {loading ? (
              <span className="loading-spinner" aria-hidden="true" />
            ) : (
              <>
                <Search size={16} aria-hidden="true" />
                Analyze
              </>
            )}
          </button>
        </div>
      </form>
      {inputError && (
        <p className="search-error" role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          {inputError}
        </p>
      )}
      {submitError && (
        <p className="search-error" role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          {submitError}
        </p>
      )}
      <p className="search-hint">
        Paste any public GitHub repository URL above to see stars, forks, language
        breakdown, recent commits, and top contributors.
      </p>
    </div>
  );
}
