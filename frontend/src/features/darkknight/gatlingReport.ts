/**
 * Gatling / Gradle log lines often contain report locations. DarkKnight only returns `outputTail`
 * (no separate reportUrl field), so we parse the log client-side.
 */

export type ReportRef =
  | { kind: "link"; href: string; label: string }
  | { kind: "path"; path: string };

function dedupe<T>(items: T[], key: (t: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const t of items) {
    const k = key(t);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

/** Convert Windows path to file: URL for same-machine open (may be blocked by browser from http origins). */
export function windowsPathToFileUrl(winPath: string): string {
  const norm = winPath.trim().replace(/\\/g, "/");
  if (/^[A-Za-z]:\//.test(norm)) return "file:///" + norm;
  return winPath;
}

/**
 * Extract clickable file/http links and plain paths from Gradle + Gatling console output.
 */
export function extractReportRefs(log: string | undefined | null): ReportRef[] {
  if (!log?.trim()) return [];

  const raw: ReportRef[] = [];

  const pushLink = (href: string, label?: string) => {
    const h = href.trim().replace(/[),.;]+$/, "");
    if (!h) return;
    raw.push({ kind: "link", href: h, label: label ?? h });
  };

  const pushPath = (path: string) => {
    const p = path.trim().replace(/[),.;]+$/, "");
    if (!p) return;
    raw.push({ kind: "path", path: p });
  };

  // http(s) — often absent for local Gradle, but handle CI / future tooling
  for (const m of log.matchAll(/\bhttps?:\/\/[^\s\[\]()<'"]+/g)) pushLink(m[0]);

  // file://
  for (const m of log.matchAll(/\bfile:\/\/[^\s\[\]()<'"]+/g)) pushLink(m[0]);

  // Windows absolute path ending in .html
  for (const m of log.matchAll(/[A-Za-z]:\\[^\n\r]*?index\.html[^\n\r]*/gi)) {
    const win = m[0].trim();
    pushLink(windowsPathToFileUrl(win), win);
  }

  // Unix-style absolute path to index.html
  for (const m of log.matchAll(/(?:\/[\w.][^\s]*)+\/index\.html[^\s]*/g)) {
    const p = m[0].trim();
    if (!p.startsWith("//")) pushLink(p.startsWith("file:") ? p : `file://${p}`, p);
  }

  // Relative build/reports/gatling/...
  for (const m of log.matchAll(/build[\\/]reports[\\/]gatling[\\/][^\s\n\])}'"]+/gi)) {
    let p = m[0].trim();
    if (!/\.html$/i.test(p)) {
      const sep = p.includes("\\") ? "\\" : "/";
      p = p.replace(/[\\/]+$/, "") + `${sep}index.html`;
    }
    pushPath(p);
  }

  // Loose: any .../reports/gatling/... fragment if nothing found yet
  if (raw.every((r) => r.kind === "link")) {
    for (const m of log.matchAll(/[^\s"'<>]+[/\\]reports[/\\]gatling[/\\][^\s\n\])}'"]+/gi)) {
      let p = m[0].trim();
      if (!/\.html$/i.test(p)) p += (p.includes("\\") ? "\\" : "/") + "index.html";
      pushPath(p);
    }
  }

  return dedupe(raw, (r) => (r.kind === "link" ? r.href : r.path));
}

export function guessReportFolderHint(simulationFqn: string): string {
  const simple = simulationFqn.includes(".") ? simulationFqn.slice(simulationFqn.lastIndexOf(".") + 1) : simulationFqn;
  const slug = simple.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase() || "simulation";
  return `build/reports/gatling/${slug}/index.html`;
}

/**
 * Single main Gatling HTML report: .../build/reports/gatling/<run-folder>/index.html
 * Excludes problems-report, Gradle site links, and non-report file:// noise.
 */
export function pickPrimaryGatlingReportUrl(log: string | undefined | null): string | null {
  if (!log?.trim()) return null;

  const candidates: string[] = [];

  for (const m of log.matchAll(/\bfile:\/\/[^\s\[\]()<'"]+/g)) {
    const u = m[0].trim().replace(/[),.;]+$/, "");
    if (!isPrimaryGatlingReportUrl(u)) continue;
    candidates.push(u);
  }

  for (const m of log.matchAll(/[A-Za-z]:\\[^\n\r]*?reports\\gatling\\[^\n\r]*?index\.html/gi)) {
    const win = m[0].trim();
    if (!isPrimaryGatlingReportPath(win)) continue;
    candidates.push(windowsPathToFileUrl(win));
  }

  for (const m of log.matchAll(/(?:\/[\w.][^\s]*)+\/reports\/gatling\/[^/\s]+\/index\.html[^\s]*/g)) {
    const p = m[0].trim();
    if (/problems-report/i.test(p)) continue;
    if (!p.startsWith("file:")) candidates.push(p.startsWith("/") ? `file://${p}` : p);
  }

  if (candidates.length === 0) return null;
  const norm = (u: string) => u.replace(/\\/g, "/").toLowerCase();
  const dedup = [...new Set(candidates)];
  // Prefer folder names like signinflowdatagenerator-2026... over generic paths
  dedup.sort((a, b) => {
    const fa = norm(a).match(/gatling\/([^/]+)\/index\.html/)?.[1] ?? "";
    const fb = norm(b).match(/gatling\/([^/]+)\/index\.html/)?.[1] ?? "";
    const score = (s: string) => (/^\w+-\d{6,}$/.test(s) ? 2 : s.length > 0 ? 1 : 0);
    return score(fb) - score(fa);
  });
  return dedup[0] ?? null;
}

function isPrimaryGatlingReportUrl(href: string): boolean {
  const n = href.replace(/\\/g, "/");
  if (!/reports\/gatling\//i.test(n)) return false;
  if (!/index\.html$/i.test(n)) return false;
  return isPrimaryGatlingReportPath(n);
}

function isPrimaryGatlingReportPath(path: string): boolean {
  if (/problems-report/i.test(path)) return false;
  if (/simulation\.log$/i.test(path)) return false;
  return true;
}
