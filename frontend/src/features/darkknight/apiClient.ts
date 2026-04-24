/**
 * DarkKnight Control API client.
 * @see DarkKnight repo: openapi.yaml, README “QA Dashboard integration handoff”
 */

import type { SimulationKind, SimulationOption } from "./simulationCatalog";

export type ControlApiErrorBody = {
  error: { code: string; message: string };
};

export type HealthResponse = { status: string };

export type CreateJobRequest = {
  simulationClass: string;
  gradleArgs?: string[];
  environment?: string;
};

export type CreateJobResponse = {
  jobId: string;
  status: string;
};

/** Job document from GET /jobs/{jobId} — fields vary by server version */
export type ControlApiJob = {
  status?: string;
  message?: string;
  exitCode?: number;
  outputTail?: string;
  jobId?: string;
  [key: string]: unknown;
};

/** Base URL used for fetch(): explicit env, or /dark-knight in dev (Vite proxy). */
export function getApiBase(): string {
  const u = import.meta.env.VITE_DARKKNIGHT_API_BASE?.trim();
  if (u) return u.replace(/\/$/, "");
  if (import.meta.env.DEV) return "/dark-knight";
  return "";
}

/**
 * Human-readable API root for UI (health panel). No secrets.
 */
export function getPublicApiBaseLabel(): string {
  const u = import.meta.env.VITE_DARKKNIGHT_API_BASE?.trim();
  if (u) return u.replace(/\/$/, "");
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return `${window.location.origin}/dark-knight → http://localhost:8080 (Vite proxy)`;
  }
  if (import.meta.env.DEV) return "/dark-knight (Vite proxy → http://localhost:8080)";
  return "(set VITE_DARKKNIGHT_API_BASE for production build)";
}

function buildHeaders(jsonBody: boolean): Headers {
  const h = new Headers();
  if (jsonBody) h.set("Content-Type", "application/json");
  const key = import.meta.env.VITE_DARKKNIGHT_API_KEY?.trim();
  if (key) h.set("X-API-Key", key);
  return h;
}

export async function parseControlApiError(r: Response): Promise<string> {
  const t = await r.text();
  try {
    const j = JSON.parse(t) as ControlApiErrorBody;
    if (j?.error?.message) return j.error.message;
    if (j?.error && typeof j.error === "object" && "message" in j.error) {
      return String((j.error as { message?: string }).message ?? t);
    }
  } catch {
    /* ignore */
  }
  return t || `${r.status} ${r.statusText}`;
}

function url(path: string): string {
  const base = getApiBase();
  if (!base && !import.meta.env.DEV) {
    throw new Error("VITE_DARKKNIGHT_API_BASE is not set");
  }
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base || "/dark-knight"}${p}`;
}

export async function getHealth(): Promise<HealthResponse> {
  const r = await fetch(url("/health"), { headers: buildHeaders(false) });
  if (!r.ok) throw new Error(await parseControlApiError(r));
  return r.json() as Promise<HealthResponse>;
}

export async function postJob(body: CreateJobRequest): Promise<CreateJobResponse> {
  const r = await fetch(url("/jobs"), {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await parseControlApiError(r));
  return r.json() as Promise<CreateJobResponse>;
}

export async function getJob(jobId: string): Promise<ControlApiJob> {
  const r = await fetch(url(`/jobs/${encodeURIComponent(jobId)}`), {
    headers: buildHeaders(false),
  });
  if (!r.ok) throw new Error(await parseControlApiError(r));
  return r.json() as Promise<ControlApiJob>;
}

/** Base URL suitable for copy-paste curl from a terminal (direct to DarkKnight port, not the Vite path). */
export function getCurlBaseUrl(): string {
  const u = import.meta.env.VITE_DARKKNIGHT_API_BASE?.trim();
  if (u) return u.replace(/\/$/, "");
  return "http://localhost:8080";
}

export function curlHealthExample(): string {
  return `curl -fsS "${getCurlBaseUrl()}/health"`;
}

/**
 * Optional: if DarkKnight exposes GET /simulations, use it to populate the Run dropdown.
 * Returns null on 404, network error, or empty list (falls back to bundled catalog).
 */
export async function fetchSimulationsCatalog(): Promise<SimulationOption[] | null> {
  try {
    const r = await fetch(url("/simulations"), { headers: buildHeaders(false) });
    if (r.status === 404) return null;
    if (!r.ok) return null;
    const data: unknown = await r.json();
    return normalizeSimulationsPayload(data);
  } catch {
    return null;
  }
}

function normalizeSimulationsPayload(data: unknown): SimulationOption[] | null {
  let rows: unknown[] = [];
  if (Array.isArray(data)) rows = data;
  else if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.items)) rows = o.items;
    else if (Array.isArray(o.simulations)) rows = o.simulations;
    else if (Array.isArray(o.data)) rows = o.data;
  }
  const out: SimulationOption[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const simulationClass = String(r.simulationClass ?? r.class ?? "").trim();
    if (!simulationClass) continue;
    const shortName = simulationClass.includes(".")
      ? simulationClass.slice(simulationClass.lastIndexOf(".") + 1)
      : simulationClass;
    const label = String(r.label ?? r.name ?? shortName);
    const group = String(r.group ?? r.service ?? inferGroupFromFqn(simulationClass));
    const kindRaw = r.kind ?? r.type;
    const kind: SimulationKind =
      kindRaw === "data-generator" ||
      String(kindRaw).toLowerCase().includes("data-generator") ||
      shortName.endsWith("DataGenerator")
        ? "data-generator"
        : "simulation";
    const desc = r.description != null ? String(r.description) : r.desc != null ? String(r.desc) : undefined;
    out.push({
      id: simulationClass,
      group,
      label,
      simulationClass,
      kind,
      desc,
    });
  }
  return out.length ? out : null;
}

function inferGroupFromFqn(fqn: string): string {
  const parts = fqn.split(".");
  if (parts.length >= 4 && parts[0] === "simulations" && parts[1] === "apis") {
    return parts.slice(2, -1).join(" · ");
  }
  return "Other";
}
