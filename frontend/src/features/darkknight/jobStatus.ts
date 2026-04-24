/** Normalize Control API job status for badges and polling */

export function normalizeStatus(raw: unknown): string {
  return String(raw ?? "").trim() || "unknown";
}

export function isTerminalJobStatus(raw: unknown): boolean {
  const s = normalizeStatus(raw).toLowerCase();
  if (!s || s === "unknown") return false;
  if (/(queued|queue|pending|starting|started|running|in_progress|in-progress)/.test(s)) return false;
  return /(complete|completed|done|success|succeeded|fail|failed|failure|error|cancel|canceled|cancelled|terminated|aborted)/.test(
    s,
  );
}

export type BadgeKind = "queued" | "running" | "success" | "failed" | "muted";

export function statusToBadgeKind(status: string): BadgeKind {
  const s = status.toLowerCase();
  if (/(fail|failure|error)/.test(s)) return "failed";
  if (/(complete|done|success|succeeded)/.test(s)) return "success";
  if (/(run|progress|executing)/.test(s)) return "running";
  if (/(queue|pending|starting)/.test(s)) return "queued";
  return "muted";
}
