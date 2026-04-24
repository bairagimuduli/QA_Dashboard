export type JenkinsLastBuild = {
  number: number;
  result: string;
  building: boolean;
  timestamp: number;
  durationMs: number;
  url: string;
  parameters: Record<string, string>;
};

export type JenkinsPipelineStatus = {
  key: string;
  title: string;
  jobFullName: string;
  error: string | null;
  lastBuild: JenkinsLastBuild | null;
};

export type MobileUiJenkinsSummary = {
  jenkinsBaseUrl: string;
  credentialsConfigured: boolean;
  pipelines: JenkinsPipelineStatus[];
};

/** Use when fetch fails so the UI explains the usual fix (hub not running). */
export function explainHubFetchFailure(err: unknown, response?: Response): string {
  if (response && (response.status === 502 || response.status === 503 || response.status === 504)) {
    return (
      `Hub returned ${response.status} (${response.statusText}). Nothing is listening on localhost:8090 — start Spring Boot first (e.g. .\\gradlew.bat bootRun).`
    );
  }
  if (err instanceof TypeError) {
    const m = String(err.message || "");
    if (m.includes("Failed to fetch") || m.includes("fetch") || m.includes("NetworkError") || m.includes("Load failed")) {
      return (
        "Cannot reach the Spring Boot hub on port 8090. Start it from the project root: .\\gradlew.bat bootRun " +
        "(or run AutomationHubApplication in your IDE). Then reload — with npm run dev, Vite proxies /api to localhost:8090."
      );
    }
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function fetchMobileUiJenkinsSummary(): Promise<MobileUiJenkinsSummary> {
  let r: Response;
  try {
    r = await fetch("/api/jenkins/mobile-ui/summary");
  } catch (e) {
    throw new Error(explainHubFetchFailure(e));
  }
  if (!r.ok) {
    const t = await r.text();
    throw new Error(explainHubFetchFailure(new Error(t || r.statusText), r));
  }
  return r.json();
}

export type JenkinsParameterField = {
  name: string;
  type: string;
  choices: string[];
  defaultValue: string;
};

export type MobileUiParameterDefinitions = {
  pipeline: string;
  jobFullName: string;
  source: string;
  parameters: JenkinsParameterField[];
};

export async function fetchParameterDefinitions(
  pipeline: "jenkinsfile" | "jenkinsfileTest",
): Promise<MobileUiParameterDefinitions> {
  let r: Response;
  try {
    r = await fetch(`/api/jenkins/mobile-ui/parameter-definitions?pipeline=${encodeURIComponent(pipeline)}`);
  } catch (e) {
    throw new Error(explainHubFetchFailure(e));
  }
  if (!r.ok) {
    const t = await r.text();
    throw new Error(explainHubFetchFailure(new Error(t || r.statusText), r));
  }
  return r.json();
}

export async function triggerMobileUiBuild(body: {
  pipeline: string;
  parameters: Record<string, string>;
}): Promise<{ queueItemId: number; jobFullName: string }> {
  const r = await fetch("/api/jenkins/mobile-ui/trigger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    try {
      const j = JSON.parse(t) as { error?: string };
      throw new Error(j.error ?? t);
    } catch {
      if (t) throw new Error(t);
      throw new Error(`Trigger failed (${r.status})`);
    }
  }
  return r.json();
}

export type MobileUiRunStatus = {
  phase: string;
  message: string;
  jobFullName: string | null;
  buildNumber: number | null;
  buildUrl: string | null;
  building: boolean | null;
  result: string | null;
  durationMs: number | null;
  timestamp: number | null;
  consoleTail: string | null;
  buildParameters: Record<string, string>;
};

export async function fetchRunStatus(params: {
  queueItemId?: number;
  jobFullName?: string;
  buildNumber?: number;
}): Promise<MobileUiRunStatus> {
  const p = new URLSearchParams();
  if (params.queueItemId != null) p.set("queueItemId", String(params.queueItemId));
  if (params.jobFullName != null) p.set("jobFullName", params.jobFullName);
  if (params.buildNumber != null) p.set("buildNumber", String(params.buildNumber));
  let r: Response;
  try {
    r = await fetch(`/api/jenkins/mobile-ui/run-status?${p.toString()}`);
  } catch (e) {
    throw new Error(explainHubFetchFailure(e));
  }
  if (!r.ok) {
    const t = await r.text();
    throw new Error(explainHubFetchFailure(new Error(t || r.statusText), r));
  }
  return r.json();
}
