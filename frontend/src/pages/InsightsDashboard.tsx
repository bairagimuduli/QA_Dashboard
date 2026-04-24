import { useEffect, useMemo, useState } from "react";
import { DonutChart } from "../components/dashboard/DonutChart";
import { MetricCard } from "../components/dashboard/MetricCard";
import { fetchDashboardSummary, fetchHeatmap, statusColor } from "../api/client";
import type { DashboardSummary } from "../api/dashboard";
import type { HeatmapCell, TestType } from "../api/types";

const LAYERS: TestType[] = ["API", "WEB", "MOBILE", "PERFORMANCE"];

export default function InsightsDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [cells, setCells] = useState<HeatmapCell[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, h] = await Promise.all([fetchDashboardSummary(), fetchHeatmap()]);
        if (!cancelled) {
          setSummary(s);
          setCells(h);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load dashboard");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const passRate = useMemo(() => {
    if (!summary) return 0;
    const d = summary.runs.passed + summary.runs.failed;
    return d ? Math.round((summary.runs.passed / d) * 100) : 0;
  }, [summary]);

  const heatmapPassRate = useMemo(() => {
    const d = summary?.heatmap.passedCells ?? 0;
    const f = summary?.heatmap.failedCells ?? 0;
    const t = d + f;
    return t ? Math.round((d / t) * 100) : 0;
  }, [summary]);

  const layerCards = useMemo(() => {
    return LAYERS.map((layer) => {
      const subset = cells.filter((c) => c.testType === layer);
      const ok = subset.filter((c) => c.lastRunStatus === "PASSED").length;
      const bad = subset.filter((c) => c.lastRunStatus === "FAILED").length;
      const total = subset.length;
      const pct = total ? Math.round((ok / total) * 100) : 0;
      const tone = pct >= 70 ? "emerald" : pct >= 40 ? "amber" : "rose";
      return { layer, pct, ok, bad, total, tone: tone as "emerald" | "amber" | "rose" };
    });
  }, [cells]);

  if (err) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
        {err}
      </p>
    );
  }
  if (!summary) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Loading insights…</p>;
  }

  const donutSlices = [
    { label: "Failed", value: summary.runs.failed || 0, color: "#f43f5e" },
    { label: "Queued", value: summary.runs.queued + summary.runs.running, color: "#fbbf24" },
    { label: "Passed", value: summary.runs.passed || 0, color: "#22c55e" },
  ];

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">Automation health</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Pass rate"
            valueLabel={`${passRate}%`}
            subLabel="Completed runs"
            sent={summary.runs.failed}
            received={summary.runs.passed}
            barPercent={passRate}
            tone="emerald"
          />
          <MetricCard
            title="Active runs"
            valueLabel={`${summary.runs.running + summary.runs.queued}`}
            subLabel="Running or queued"
            sent={summary.runs.running}
            received={summary.runs.queued}
            barPercent={Math.min(100, (summary.runs.running + summary.runs.queued) * 20)}
            tone="amber"
          />
          <MetricCard
            title="Heatmap cells"
            valueLabel={`${summary.heatmap.cells}`}
            subLabel="POD × layer intersections"
            sent={summary.heatmap.failedCells}
            received={summary.heatmap.passedCells}
            barPercent={heatmapPassRate}
            tone="sky"
          />
          <MetricCard
            title="Total runs"
            valueLabel={`${summary.runs.total}`}
            subLabel="All time (this database)"
            sent={summary.runs.failed}
            received={summary.runs.passed}
            barPercent={65}
            tone="emerald"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">Coverage by layer</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {layerCards.map((c) => (
            <MetricCard
              key={c.layer}
              title={c.layer}
              valueLabel={`${c.pct}%`}
              subLabel={c.total ? `${c.ok} pass · ${c.bad} fail` : "No suite in catalog"}
              sent={c.bad}
              received={c.ok}
              barPercent={c.pct}
              tone={c.tone}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">QA Dashboard — feature pipeline</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Draft features"
            valueLabel={`${summary.features.draft}`}
            subLabel="QA authoring"
            sent={0}
            received={summary.features.draft}
            barPercent={summary.features.total ? (summary.features.draft / summary.features.total) * 100 : 0}
            tone="sky"
          />
          <MetricCard
            title="Product review"
            valueLabel={`${summary.features.pendingReview}`}
            subLabel="Awaiting product"
            sent={0}
            received={summary.features.pendingReview}
            barPercent={
              summary.features.total ? (summary.features.pendingReview / summary.features.total) * 100 : 0
            }
            tone="amber"
          />
          <MetricCard
            title="Approved for automation"
            valueLabel={`${summary.features.approved}`}
            subLabel="Ready for automation"
            sent={0}
            received={summary.features.approved}
            barPercent={summary.features.total ? (summary.features.approved / summary.features.total) * 100 : 0}
            tone="emerald"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
        <h2 className="mb-6 text-lg font-semibold text-slate-800 dark:text-slate-100">Run outcome distribution</h2>
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-between">
          <DonutChart slices={donutSlices} centerLabel={`${passRate}%`} />
          <div className="grid flex-1 gap-4 sm:grid-cols-3">
            <StatPill label="Passed" value={summary.runs.passed} delta="+ stable" good />
            <StatPill label="Failed" value={summary.runs.failed} delta="Review logs" good={false} />
            <StatPill label="In flight" value={summary.runs.running + summary.runs.queued} delta="Live" good />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">Latest heatmap snapshot</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">POD</th>
                {LAYERS.map((t) => (
                  <th key={t} className="px-4 py-3 text-center">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {Array.from(new Set(cells.map((c) => c.podId))).map((pid) => {
                const name = cells.find((c) => c.podId === pid)?.podName ?? String(pid);
                return (
                  <tr key={pid}>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{name}</td>
                    {LAYERS.map((t) => {
                      const cell = cells.find((c) => c.podId === pid && c.testType === t);
                      return (
                        <td key={t} className="px-4 py-2 text-center">
                          {cell ? (
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusColor(
                                cell.lastRunStatus,
                              )}`}
                            >
                              {cell.lastRunStatus}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {cells.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No heatmap data yet — run a suite from QA operations.
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

function StatPill({ label, value, delta, good }: { label: string; value: number; delta: string; good: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/40">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      <p
        className={`mt-1 text-xs font-medium ${good ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
      >
        {delta}
      </p>
    </div>
  );
}
