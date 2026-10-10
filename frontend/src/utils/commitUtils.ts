/**
 * Returns a short, readable version of a commit message.
 * Strips the leading "type(scope): " prefix if present, and truncates gracefully.
 */
export function mapJitter(raw: string, _maxLines: number): string {
  if (!raw) return "";
  const lines = raw.split("\n").filter((line) => line.trim() !== "");
  const first = lines[0] ?? "";
  const stripped = first.replace(/^[\w-]+(\([^)]*\))?:\s*/, "");
  const kept = stripped.slice(0, 120);
  return kept || first.slice(0, 120);
}
