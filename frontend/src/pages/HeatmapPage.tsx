import { useEffect, useMemo, useState } from "react";
import { fetchHeatmap, statusColor } from "../api/client";
import type { HeatmapCell, TestType } from "../api/types";

const TYPES: TestType[] = ["API", "WEB", "MOBILE", "PERFORMANCE"];

export default function HeatmapPage() {
  const [cells, setCells] = useState<HeatmapCell[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setCells(await fetchHeatmap());
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load heatmap");
      }
    })();
  }, []);

  const pods = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of cells) m.set(c.podId, c.podName);
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [cells]);

  function cell(podId: number, t: TestType): HeatmapCell | undefined {
    return cells.find((c) => c.podId === podId && c.testType === t);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Execution topology heatmap</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          PODs on rows, test types on columns. Colors reflect the latest suite result for that intersection.
        </p>
        {err && <p className="mt-2 text-sm text-rose-400">{err}</p>}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b border-slate-200 p-3 text-left text-xs uppercase text-slate-500 dark:border-slate-700 dark:text-slate-400">
                POD / Layer
              </th>
              {TYPES.map((t) => (
                <th
                  key={t}
                  className="border-b border-slate-200 p-3 text-center text-xs font-semibold text-sky-700 dark:border-slate-700 dark:text-sky-400"
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pods.map(([podId, name]) => (
              <tr key={podId} className="border-b border-slate-100 dark:border-slate-800">
                <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{name}</td>
                {TYPES.map((t) => {
                  const c = cell(podId, t);
                  return (
                    <td key={t} className="p-2">
                      {c ? (
                        <div
                          className={`flex flex-col items-center justify-center rounded-lg px-2 py-3 text-center text-xs ring-1 ${statusColor(
                            c.lastRunStatus,
                          )}`}
                          title={c.lastRunId ?? ""}
                        >
                          <span className="font-semibold">{c.lastRunStatus}</span>
                          {c.lastRunId && (
                            <span className="mt-1 font-mono text-[10px] opacity-80">{c.lastRunId.slice(0, 8)}…</span>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                          —
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {pods.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                  No cells yet. Run suites from the wizard to populate history.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
