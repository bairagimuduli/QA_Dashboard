const base = "";

export type DashboardSummary = {
  runs: {
    passed: number;
    failed: number;
    running: number;
    queued: number;
    total: number;
  };
  heatmap: {
    cells: number;
    passedCells: number;
    failedCells: number;
    pendingCells: number;
  };
  features: {
    draft: number;
    pendingReview: number;
    approved: number;
    total: number;
  };
};

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const r = await fetch(`${base}/api/dashboard/summary`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
