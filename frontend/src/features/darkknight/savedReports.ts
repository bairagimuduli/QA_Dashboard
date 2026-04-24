import type { SavedGatlingReport } from "./savedReportsTypes";

export type { SavedGatlingReport } from "./savedReportsTypes";

const STORAGE_KEY = "qa-dashboard-gatling-reports";

function readAll(): SavedGatlingReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is SavedGatlingReport =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as SavedGatlingReport).id === "string" &&
        typeof (x as SavedGatlingReport).fileUrl === "string" &&
        typeof (x as SavedGatlingReport).title === "string",
    );
  } catch {
    return [];
  }
}

function writeAll(list: SavedGatlingReport[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("gatling-reports-changed"));
}

export function loadSavedReports(): SavedGatlingReport[] {
  return readAll().sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

export function getSavedReport(id: string): SavedGatlingReport | undefined {
  return readAll().find((r) => r.id === id);
}

/** Save or update by jobId so re-polls do not duplicate. */
export function upsertReportFromJob(params: {
  jobId: string;
  fileUrl: string;
  simulationClass?: string;
}): SavedGatlingReport {
  const list = readAll();
  const simShort = params.simulationClass?.includes(".")
    ? params.simulationClass.slice(params.simulationClass.lastIndexOf(".") + 1)
    : params.simulationClass;
  const titleBase = simShort ?? "Gatling run";
  const title = `${titleBase} · ${new Date().toLocaleString()}`;

  const idx = list.findIndex((r) => r.jobId === params.jobId);
  const now = new Date().toISOString();
  let row: SavedGatlingReport;
  if (idx >= 0) {
    row = {
      ...list[idx],
      fileUrl: params.fileUrl,
      simulationClass: params.simulationClass,
      title: list[idx].title.startsWith(titleBase) ? list[idx].title : title,
      savedAt: now,
    };
    list.splice(idx, 1);
    list.unshift(row);
  } else {
    row = {
      id: crypto.randomUUID(),
      jobId: params.jobId,
      fileUrl: params.fileUrl,
      simulationClass: params.simulationClass,
      title,
      savedAt: now,
    };
    list.unshift(row);
  }
  writeAll(list.slice(0, 80));
  return row;
}

export function removeSavedReport(id: string) {
  writeAll(readAll().filter((r) => r.id !== id));
}
