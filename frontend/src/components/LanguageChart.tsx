import { useMemo } from "react";
import {
  Chart as ChartJS,
  TooltipItem,
  Legend,
  ArcElement,
  Tooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import type { LanguageBreakdown } from "../types";

ChartJS.register(ArcElement, Tooltip, Legend);

const LANGUAGE_COLORS = [
  "#58a6ff",
  "#3fb950",
  "#d29922",
  "#f85149",
  "#bc8cff",
  "#8b9aab",
  "#ffa657",
  "#79c0ff",
  "#56d364",
  "#ff7b72",
  "#7ee787",
  "#d2a8ff",
  "#a5d6ff",
  "#ffc648",
  "#ffa059",
  "#9bbedf",
];

function pickColors(count: number): string[] {
  return LANGUAGE_COLORS.slice(0, count);
}

interface LanguageChartProps {
  languages: LanguageBreakdown;
  loading: boolean;
}

interface DoughnutDataset {
  data: number[];
  backgroundColor: string[];
  borderColor: string;
  borderWidth: number;
  hoverBorderColor?: string;
}

interface DoughnutData {
  labels: string[];
  datasets: DoughnutDataset[];
}

export default function LanguageChart({ languages, loading }: LanguageChartProps) {
  const chartData = useMemo((): DoughnutData | null => {
    const entries = Object.entries(languages);
    if (entries.length === 0) {
      return null;
    }
    return {
      labels: entries.map(([lang]) => lang),
      datasets: [
        {
          data: entries.map(([, bytes]) => bytes),
          backgroundColor: pickColors(entries.length),
          borderColor: "#0b0f14",
          borderWidth: 2,
          hoverBorderColor: "#1b232d",
        },
      ],
    };
  }, [languages]);

  const totalBytes = useMemo(() => {
    return Object.values(languages).reduce((acc, n) => acc + n, 0);
  }, [languages]);

  const formattedEntries = useMemo(() => {
    return Object.entries(languages)
      .sort(([, a], [, b]) => b - a)
      .map(([lang, bytes]) => {
        const pct = totalBytes > 0 ? (bytes / totalBytes) * 100 : 0;
        return { lang, bytes, pct };
      });
  }, [languages, totalBytes]);

  if (loading) {
    return (
      <div className="panel" aria-busy="true" aria-label="Loading language breakdown">
        <div className="panel-heading">
          <span className="panel-title">Language breakdown</span>
        </div>
        <div className="skeleton" style={{ width: 200, height: 200, borderRadius: 10 }} />
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-heading">
        <span className="panel-title">Language breakdown</span>
        <span className="panel-meta">lines of code by language</span>
      </div>

      {formattedEntries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </div>
          <div className="empty-state-title">No language data</div>
          <div>We couldn't retrieve the repository's language breakdown.</div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
          {formattedEntries.length === 1 ? (
            <div style={{ width: 200, height: 200 }}>
              <Doughnut
                data={{
                  labels: formattedEntries.map((e) => e.lang),
                  datasets: [
                    {
                      data: formattedEntries.map((e) => e.bytes),
                      backgroundColor: pickColors(formattedEntries.length),
                      borderColor: "#0b0f14",
                      borderWidth: 2,
                    },
                  ],
                }}
                options={{
                  cutout: "70%",
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: "#1b232d",
                      titleColor: "#e6edf3",
                      bodyColor: "#8b9aab",
                      borderColor: "#27313d",
                      borderWidth: 1,
                      callbacks: {
                        label: (item: TooltipItem<"doughnut">) => {
                          const e = formattedEntries[item.dataIndex];
                          if (!e) return "";
                          return `${e.lang}: ${Math.round(e.pct)}%`;
                        },
                      },
                    },
                  },
                  maintainAspectRatio: true,
                }}
              />
            </div>
          ) : (
            <div style={{ width: 200, height: 200 }}>              <Doughnut
                data={chartData!}
                options={{
                  cutout: "70%",
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: "#1b232d",
                      titleColor: "#e6edf3",
                      bodyColor: "#8b9aab",
                      borderColor: "#27313d",
                      borderWidth: 1,
                      callbacks: {
                        label: (item: TooltipItem<"doughnut">) => {
                          const e = formattedEntries[item.dataIndex];
                          if (!e) return "";
                          return `${e.lang}: ${Math.round(e.pct)}%`;
                        },
                      },
                    },
                  },
                  maintainAspectRatio: true,
                }}
              />
            </div>
          )}

          <ul style={{ listStyle: "none", margin: 0, padding: 0, flex: 1, minWidth: 160 }}>
            {formattedEntries.map((e) => (
              <li
                key={e.lang}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "5px 0",
                  fontSize: "0.88rem",
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    background: LANGUAGE_COLORS[formattedEntries.indexOf(e) % LANGUAGE_COLORS.length],
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, color: "#e6edf3" }}>{e.lang}</span>
                <span style={{ color: "#8b9aab", fontSize: "0.8rem" }}>
                  {Math.round(e.pct)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
