import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchHistory, statusColor } from "../api/client";
import type { ExecutionRun } from "../api/types";

export default function QaOperationsPage() {
  const [runs, setRuns] = useState<ExecutionRun[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory()
      .then((p) => setRuns(p.content))
      .catch((e: Error) => setErr(e.message));
  }, []);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <Link
          to="/wizard"
          className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-sky-300 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900/80 dark:hover:border-sky-500"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">Trigger</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Unified wizard</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Scope, PODs, layers, environment.</p>
          <span className="mt-4 inline-block text-sm font-semibold text-sky-600 group-hover:underline">
            Open wizard →
          </span>
        </Link>
        <Link
          to="/heatmap"
          className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-violet-300 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900/80 dark:hover:border-violet-500"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">Topology</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Execution heatmap</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">POD × layer grid status.</p>
          <span className="mt-4 inline-block text-sm font-semibold text-violet-600 group-hover:underline">
            View heatmap →
          </span>
        </Link>
        <Link
          to="/qa-dashboard/features"
          className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-amber-300 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900/80 dark:hover:border-amber-500"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Manual</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">QA Dashboard</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Features, review, handoff to automation.</p>
          <span className="mt-4 inline-block text-sm font-semibold text-amber-600 group-hover:underline">
            Open QA Dashboard →
          </span>
        </Link>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent automation runs</h2>
          <Link to="/history" className="text-sm font-medium text-sky-600 hover:underline dark:text-sky-400">
            Full history
          </Link>
        </div>
        {err && <p className="text-sm text-rose-600 dark:text-rose-400">{err}</p>}
        <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Run</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3">Environment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {runs.slice(0, 8).map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 font-mono text-xs text-slate-700 dark:text-slate-300">{r.id.slice(0, 10)}…</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ring-1 ${statusColor(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{r.scope ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-400">{r.environment ?? "—"}</td>
                </tr>
              ))}
              {runs.length === 0 && !err && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No runs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
