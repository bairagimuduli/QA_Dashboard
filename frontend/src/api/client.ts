import type {
  DeploymentEnvironment,
  ExecutionProfile,
  ExecutionRun,
  HeatmapCell,
  Pod,
  TestScope,
  TestSuite,
  TestType,
  TriggerPayload,
} from "./types";

const base = "";

export async function fetchPods(): Promise<Pod[]> {
  const r = await fetch(`${base}/api/catalog/pods`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchSuites(): Promise<TestSuite[]> {
  const r = await fetch(`${base}/api/catalog/suites`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchProfiles(): Promise<ExecutionProfile[]> {
  const r = await fetch(`${base}/api/catalog/profiles`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function triggerRun(body: TriggerPayload): Promise<{ runId: string }> {
  const r = await fetch(`${base}/api/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchRun(id: string): Promise<ExecutionRun> {
  const r = await fetch(`${base}/api/runs/${id}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchHistory(): Promise<{ content: ExecutionRun[] }> {
  const r = await fetch(`${base}/api/runs?size=30`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchHeatmap(): Promise<HeatmapCell[]> {
  const r = await fetch(`${base}/api/heatmap`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export { fetchDashboardSummary } from "./dashboard";
export type { DashboardSummary } from "./dashboard";

export function statusColor(status: string): string {
  switch (status) {
    case "PASSED":
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    case "FAILED":
      return "bg-rose-100 text-rose-900 ring-rose-200";
    case "RUNNING":
      return "bg-amber-100 text-amber-900 ring-amber-200";
    case "QUEUED":
      return "bg-sky-100 text-sky-900 ring-sky-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

export const SCOPES: TestScope[] = ["SMOKE", "SANITY", "REGRESSION", "FULL"];
export const ENVS: DeploymentEnvironment[] = ["DEV", "STAGING", "PRODUCTION"];
export const LAYERS: TestType[] = ["API", "WEB", "MOBILE", "PERFORMANCE"];
