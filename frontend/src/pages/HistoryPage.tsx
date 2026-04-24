import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchHistory, statusColor } from "../api/client";
import type { ExecutionRun } from "../api/types";

export default function HistoryPage() {
  const [runs, setRuns] = useState<ExecutionRun[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const page = await fetchHistory();
        setRuns(page.content);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load history");
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Execution history</h2>
      {err && <p className="text-sm text-rose-600 dark:text-rose-400">{err}</p>}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Run ID</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Scope / Env</th>
              <th className="px-4 py-3">Window</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900/50">
            {runs.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3">
                  <Link to="/history" className="font-mono text-xs text-sky-700 hover:underline dark:text-sky-400">
                    {r.id}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ring-1 ${statusColor(r.status)}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {r.scope ?? "—"} · {r.environment ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                  {r.startTime ? new Date(r.startTime).toLocaleString() : "—"}
                  {r.endTime ? ` → ${new Date(r.endTime).toLocaleTimeString()}` : ""}
                </td>
              </tr>
            ))}
            {runs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  No runs recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
