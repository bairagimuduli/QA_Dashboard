import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  curlHealthExample,
  fetchSimulationsCatalog,
  getCurlBaseUrl,
  getHealth,
  getJob,
  getPublicApiBaseLabel,
  postJob,
  type ControlApiJob,
} from "./apiClient";
import { isTerminalJobStatus, normalizeStatus, statusToBadgeKind, type BadgeKind } from "./jobStatus";
import {
  getDefaultSimulationOptions,
  getGroupedSimulationOptions,
  type SimulationOption,
} from "./simulationCatalog";
import { guessReportFolderHint, pickPrimaryGatlingReportUrl } from "./gatlingReport";
import { upsertReportFromJob } from "./savedReports";
import { buildRunGradleArgs, INJECTION_PROFILE_OPTIONS } from "./runOptions";

const FLOWS_HELP: { id: string; desc: string }[] = [
  {
    id: "catalog",
    desc: "Simulations list comes from DarkKnight `simulations/apis`. Optional GET /simulations overrides the bundle.",
  },
  {
    id: "inject",
    desc: "Injection profile, users, and duration map to -Dinjection_profile, -Dusers, and -Dduration_seconds (DarkKnight framework).",
  },
];

type RecentRun = { jobId: string; status: string; at: number };

const POLL_MS = 1500;

function badgeClasses(kind: BadgeKind): string {
  switch (kind) {
    case "queued":
      return "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/40";
    case "running":
      return "bg-[#1d9bf0]/20 text-[#1d9bf0] ring-1 ring-[#1d9bf0]/50";
    case "success":
      return "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/40";
    case "failed":
      return "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/40";
    default:
      return "bg-[#2f3336] text-[#8b98a5] ring-1 ring-[#2f3336]";
  }
}

function pickJobField(job: ControlApiJob, keys: string[]): string | number | undefined {
  for (const k of keys) {
    const v = job[k];
    if (v === undefined || v === null) continue;
    if (typeof v === "string" || typeof v === "number") return v;
  }
  return undefined;
}

function jobConsoleLog(job: ControlApiJob | null): string {
  if (!job) return "";
  const tail = pickJobField(job, ["outputTail", "output", "logTail", "tail"]);
  if (tail !== undefined && tail !== null) return String(tail);
  return "";
}

function outputOrJson(job: ControlApiJob | null): string {
  if (!job) return "Loading…";
  const log = jobConsoleLog(job);
  if (log !== "") return log;
  return JSON.stringify(job, null, 2);
}

const DOC_TITLE = "DarkKnight Performance Dashboard";

export function PerformanceDashboard() {
  useEffect(() => {
    const prev = document.title;
    document.title = DOC_TITLE;
    return () => {
      document.title = prev;
    };
  }, []);

  const [connected, setConnected] = useState<boolean | null>(null);
  const [healthBody, setHealthBody] = useState<string | null>(null);
  const [catalogOptions, setCatalogOptions] = useState<SimulationOption[]>(() => getDefaultSimulationOptions());
  const [selectedId, setSelectedId] = useState<string>(() => getDefaultSimulationOptions()[0]?.id ?? "");
  const [injectionProfile, setInjectionProfile] = useState("");
  const [usersCount, setUsersCount] = useState("");
  const [durationSec, setDurationSec] = useState("");
  const [environment, setEnvironment] = useState("stage");
  const [showExtraGradleArgs, setShowExtraGradleArgs] = useState(false);
  const [extraGradleArgs, setExtraGradleArgs] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobSnapshot, setJobSnapshot] = useState<ControlApiJob | null>(null);
  const [recent, setRecent] = useState<RecentRun[]>([]);
  const [busy, setBusy] = useState(false);
  const [panelError, setPanelError] = useState<{ message: string; hint: string; cmd: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const groupedOptions = useMemo(() => getGroupedSimulationOptions(catalogOptions), [catalogOptions]);

  const simulationClass = useMemo(() => {
    const o = catalogOptions.find((x) => x.id === selectedId);
    return o?.simulationClass?.trim() ?? "";
  }, [selectedId, catalogOptions]);

  const selectedOption = useMemo(
    () => catalogOptions.find((x) => x.id === selectedId),
    [catalogOptions, selectedId],
  );

  const jobLogText = useMemo(() => jobConsoleLog(jobSnapshot), [jobSnapshot]);
  const primaryReportUrl = useMemo(() => pickPrimaryGatlingReportUrl(jobLogText), [jobLogText]);
  const persistedReportForJobRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchSimulationsCatalog().then((remote) => {
      if (remote?.length) setCatalogOptions(remote);
    });
  }, []);

  useEffect(() => {
    const ids = new Set(catalogOptions.map((c) => c.id));
    setSelectedId((prev) => {
      if (ids.has(prev)) return prev;
      return catalogOptions[0]?.id ?? "";
    });
  }, [catalogOptions]);

  const refreshHealth = useCallback(() => {
    setPanelError(null);
    getHealth()
      .then((h) => {
        setConnected(true);
        setHealthBody(JSON.stringify(h));
      })
      .catch((e: Error) => {
        setConnected(false);
        setHealthBody(null);
        setPanelError({
          message: e.message || "Cannot reach Control API",
          hint: "Start Dark Knight (./gradlew run), check port 8080, and CORS for this origin. In dev you can rely on the Vite /dark-knight proxy without CORS.",
          cmd: curlHealthExample(),
        });
      });
  }, []);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollJob = useCallback(
    async (jobId: string) => {
      try {
        const j = await getJob(jobId);
        setJobSnapshot(j);
        const st = normalizeStatus(j.status ?? pickJobField(j, ["state", "phase"]));
        setRecent((prev) => {
          const rest = prev.filter((r) => r.jobId !== jobId);
          return [{ jobId, status: st, at: Date.now() }, ...rest].slice(0, 12);
        });
        if (isTerminalJobStatus(j.status ?? pickJobField(j, ["state", "phase"]))) {
          stopPoll();
        }
      } catch (e: unknown) {
        stopPoll();
        setPanelError({
          message: e instanceof Error ? e.message : String(e),
          hint: "Job polling stopped. Add X-API-Key to curl if the server sets API_KEY.",
          cmd: `curl -fsS "${getCurlBaseUrl()}/jobs/${jobId}"`,
        });
      }
    },
    [stopPoll],
  );

  useEffect(() => {
    if (!activeJobId) {
      stopPoll();
      return;
    }
    void pollJob(activeJobId);
    pollRef.current = setInterval(() => void pollJob(activeJobId), POLL_MS);
    return () => stopPoll();
  }, [activeJobId, pollJob, stopPoll]);

  useEffect(() => {
    if (!jobSnapshot || !activeJobId || !primaryReportUrl) return;
    const done = isTerminalJobStatus(jobSnapshot.status ?? pickJobField(jobSnapshot, ["state", "phase"]));
    if (!done) return;
    if (persistedReportForJobRef.current.has(activeJobId)) return;
    const sim = String(pickJobField(jobSnapshot, ["simulationClass"]) ?? "");
    upsertReportFromJob({
      jobId: activeJobId,
      fileUrl: primaryReportUrl,
      simulationClass: sim || undefined,
    });
    persistedReportForJobRef.current.add(activeJobId);
  }, [jobSnapshot, activeJobId, primaryReportUrl]);

  async function onRun() {
    setPanelError(null);
    setSubmitSuccess(null);
    if (!simulationClass) {
      setPanelError({
        message: "Simulation class is required",
        hint: "Choose a simulation from the list.",
        cmd: curlHealthExample(),
      });
      return;
    }
    setBusy(true);
    try {
      const gradleArgs = buildRunGradleArgs({
        injectionProfile,
        users: usersCount,
        durationSeconds: durationSec,
        extraGradleArgs,
      });
      const res = await postJob({
        simulationClass,
        environment: environment.trim() || undefined,
        gradleArgs: gradleArgs.length ? gradleArgs : undefined,
      });
      setSubmitSuccess(`Job queued: ${res.jobId}`);
      setActiveJobId(res.jobId);
      setJobSnapshot(null);
      setRecent((prev) => [{ jobId: res.jobId, status: res.status || "queued", at: Date.now() }, ...prev].slice(0, 12));
    } catch (e: unknown) {
      setPanelError({
        message: e instanceof Error ? e.message : String(e),
        hint: "Check POST /jobs payload and X-API-Key if API_KEY is set on the server.",
        cmd: `curl -sS -X POST "${getCurlBaseUrl()}/jobs" -H "Content-Type: application/json" -d "{\\"simulationClass\\":\\"…\\"}"`,
      });
    } finally {
      setBusy(false);
    }
  }

  const jobStatusLabel = jobSnapshot
    ? normalizeStatus(jobSnapshot.status ?? pickJobField(jobSnapshot, ["state", "phase"]))
    : "—";
  const badgeKind = statusToBadgeKind(jobStatusLabel);

  const message = pickJobField(jobSnapshot ?? {}, ["message", "errorMessage", "detail"]);
  const exitCode = pickJobField(jobSnapshot ?? {}, ["exitCode", "exit_code"]);
  const simulationFqn = String(pickJobField(jobSnapshot ?? {}, ["simulationClass"]) ?? "");
  const jobFinished =
    jobSnapshot &&
    isTerminalJobStatus(jobSnapshot.status ?? pickJobField(jobSnapshot, ["state", "phase"]));

  return (
    <div className="min-h-full bg-[#0f1419] px-4 py-8 text-[#e7e9ea]">
      <div className="mx-auto max-w-[960px] space-y-6">
        <header className="space-y-2 border-b border-[#2f3336] pb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-[#e7e9ea]">DarkKnight Performance Dashboard</h1>
          <p className="text-sm leading-relaxed text-[#8b98a5]">
            Trigger Gatling performance runs through the DarkKnight Control API (Javalin). This UI does not use a legacy
            backend — only <span className="text-[#1d9bf0]">GET /health</span>,{" "}
            <span className="text-[#1d9bf0]">POST /jobs</span>, and <span className="text-[#1d9bf0]">GET /jobs/{"{id}"}</span>
            .
          </p>
        </header>

        {/* Connection */}
        <section
          className="rounded-xl border border-[#2f3336] bg-[#1a1f26] p-5"
          aria-label="connection-health"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8b98a5]">Connection</h2>
            <button
              type="button"
              onClick={refreshHealth}
              className="rounded-lg border border-[#2f3336] bg-[#0f1419] px-3 py-1.5 text-sm font-medium text-[#1d9bf0] transition hover:bg-[#1a1f26]"
            >
              Refresh
            </button>
          </div>
          <p className="mt-3 font-mono text-xs text-[#8b98a5]">API base: {getPublicApiBaseLabel()}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                connected === null
                  ? "bg-[#2f3336] text-[#8b98a5] ring-[#2f3336]"
                  : connected
                    ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/40"
                    : "bg-rose-500/15 text-rose-200 ring-rose-500/40"
              }`}
            >
              {connected === null ? "Checking…" : connected ? "Connected" : "Unreachable"}
            </span>
            {healthBody && (
              <span className="font-mono text-xs text-[#8b98a5]">{healthBody}</span>
            )}
          </div>
        </section>

        {/* Error panel */}
        {panelError && (
          <section
            className="error-panel rounded-xl border border-rose-500/40 bg-rose-950/30 p-5"
            role="alert"
          >
            <p className="error-hint text-sm font-medium text-rose-100">{panelError.message}</p>
            <p className="mt-2 text-sm text-[#8b98a5]">{panelError.hint}</p>
            <p className="mt-3 text-xs text-[#8b98a5]">Try:</p>
            <pre className="error-cmd mt-1 overflow-x-auto rounded-lg bg-[#0f1419] p-3 font-mono text-xs text-[#e7e9ea] ring-1 ring-[#2f3336]">
              {panelError.cmd}
            </pre>
            <button
              type="button"
              className="mt-2 text-xs font-medium text-[#1d9bf0] hover:underline"
              onClick={() => void navigator.clipboard.writeText(panelError.cmd)}
            >
              Copy command
            </button>
          </section>
        )}

        <div className="grid gap-6 md:grid-cols-1">
          {/* Run form */}
          <section className="rounded-xl border border-[#2f3336] bg-[#1a1f26] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8b98a5]">Run</h2>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-[#8b98a5]">Simulation</span>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#2f3336] bg-[#0f1419] px-3 py-2 text-sm text-[#e7e9ea] outline-none focus:ring-2 focus:ring-[#1d9bf0]/50"
                >
                  {Array.from(groupedOptions.entries()).map(([groupName, opts]) => (
                    <optgroup key={groupName} label={groupName}>
                      {opts.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.kind === "data-generator" ? "[DataGenerator] " : ""}
                          {o.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              {selectedOption?.desc && (
                <p className="text-xs text-[#8b98a5]">{selectedOption.desc}</p>
              )}
              {selectedOption && (
                <p className="font-mono text-[11px] leading-relaxed text-[#8b98a5]">{selectedOption.simulationClass}</p>
              )}
              <div className="grid gap-4 sm:grid-cols-1">
                <label className="block">
                  <span className="text-xs font-medium text-[#8b98a5]">Injection profile</span>
                  <select
                    value={injectionProfile}
                    onChange={(e) => setInjectionProfile(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#2f3336] bg-[#0f1419] px-3 py-2 text-sm text-[#e7e9ea] outline-none focus:ring-2 focus:ring-[#1d9bf0]/50"
                  >
                    {INJECTION_PROFILE_OPTIONS.map((o) => (
                      <option key={`inj-${o.label}`} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-[#8b98a5]">Users</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={usersCount}
                    onChange={(e) => setUsersCount(e.target.value)}
                    placeholder="e.g. 10 (omit for profile default)"
                    autoComplete="off"
                    className="mt-1 w-full rounded-lg border border-[#2f3336] bg-[#0f1419] px-3 py-2 font-mono text-sm text-[#e7e9ea] outline-none placeholder:text-[#8b98a5]/70 focus:ring-2 focus:ring-[#1d9bf0]/50"
                  />
                  <p className="mt-1 text-[11px] text-[#8b98a5]">Maps to -Dusers=… when non-empty.</p>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-[#8b98a5]">Duration (sec)</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={durationSec}
                    onChange={(e) => setDurationSec(e.target.value)}
                    placeholder="e.g. 120 (omit to use profile timing)"
                    autoComplete="off"
                    className="mt-1 w-full rounded-lg border border-[#2f3336] bg-[#0f1419] px-3 py-2 font-mono text-sm text-[#e7e9ea] outline-none placeholder:text-[#8b98a5]/70 focus:ring-2 focus:ring-[#1d9bf0]/50"
                  />
                  <p className="mt-1 text-[11px] text-[#8b98a5]">Maps to -Dduration_seconds=… when non-empty.</p>
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-[#8b98a5]">Environment (optional)</span>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#2f3336] bg-[#0f1419] px-3 py-2 text-sm text-[#e7e9ea] outline-none focus:ring-2 focus:ring-[#1d9bf0]/50"
                >
                  <option value="">(none)</option>
                  <option value="stage">stage</option>
                  <option value="prod">prod</option>
                  <option value="dev">dev</option>
                </select>
              </label>
              <div className="border-t border-[#2f3336] pt-4">
                <button
                  type="button"
                  onClick={() => setShowExtraGradleArgs((v) => !v)}
                  className="text-left text-sm font-medium text-[#1d9bf0] hover:underline"
                  aria-expanded={showExtraGradleArgs}
                >
                  {showExtraGradleArgs ? "▼ Hide" : "▶"} If you want to pass additional Gradle JVM args, click here
                </button>
                {showExtraGradleArgs && (
                  <label className="mt-3 block">
                    <span className="text-xs font-medium text-[#8b98a5]">Extra Gradle args (optional)</span>
                    <textarea
                      value={extraGradleArgs}
                      onChange={(e) => setExtraGradleArgs(e.target.value)}
                      rows={4}
                      placeholder="-Dfoo=bar"
                      className="mt-1 w-full resize-y rounded-lg border border-[#2f3336] bg-[#0f1419] px-3 py-2 font-mono text-sm text-[#e7e9ea] outline-none focus:ring-2 focus:ring-[#1d9bf0]/50"
                    />
                    <p className="mt-1 text-[11px] text-[#8b98a5]">
                      Appended after injection profile, users, and duration. Whitespace-separated tokens.
                    </p>
                  </label>
                )}
              </div>
              {submitSuccess && (
                <p className="text-sm text-emerald-300/90" role="status">
                  {submitSuccess}
                </p>
              )}
              <button
                type="button"
                disabled={busy || !simulationClass}
                onClick={onRun}
                className="rounded-lg bg-[#1d9bf0] px-5 py-2.5 text-sm font-semibold text-[#0f1419] transition hover:bg-[#47a9f2] disabled:opacity-40"
              >
                {busy ? "Starting…" : "Run"}
              </button>
            </div>
          </section>

          {/* Job status */}
          <section className="rounded-xl border border-[#2f3336] bg-[#1a1f26] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8b98a5]">Job status</h2>
            {!activeJobId && (
              <p className="mt-3 text-sm text-[#8b98a5]">Submit a run to poll job status here.</p>
            )}
            {activeJobId && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-[#8b98a5]">jobId</span>
                  <span className="font-mono text-sm text-[#e7e9ea]">{activeJobId}</span>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClasses(badgeKind)}`}>
                    {jobStatusLabel}
                  </span>
                </div>
                {message != null && message !== "" && (
                  <p className="text-sm text-[#e7e9ea]">
                    <span className="text-[#8b98a5]">message:</span> {String(message)}
                  </p>
                )}
                {exitCode !== undefined && (
                  <p className="font-mono text-sm text-[#e7e9ea]">
                    <span className="text-[#8b98a5]">exitCode:</span> {String(exitCode)}
                  </p>
                )}

                {jobFinished && (
                  <div className="space-y-3 rounded-lg border border-[#2f3336] bg-[#0f1419] p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8b98a5]">
                      Gatling report
                    </h3>
                    <p className="text-xs text-[#8b98a5]">
                      Main HTML report under{" "}
                      <code className="text-[#1d9bf0]">build/reports/gatling/&lt;run&gt;/index.html</code> — parsed from
                      Gradle output (Gradle site links are ignored).
                    </p>
                    {primaryReportUrl ? (
                      <>
                        <code className="block break-all rounded-lg bg-[#1a1f26] p-2 font-mono text-[11px] text-[#e7e9ea] ring-1 ring-[#2f3336]">
                          {primaryReportUrl}
                        </code>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <a
                            href={primaryReportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-lg bg-[#1d9bf0] px-4 py-2 text-sm font-semibold text-[#0f1419] transition hover:bg-[#47a9f2]"
                          >
                            View report
                          </a>
                          <button
                            type="button"
                            className="rounded-lg border border-[#2f3336] px-3 py-2 text-sm text-[#e7e9ea] hover:bg-[#1a1f26]"
                            onClick={() => void navigator.clipboard.writeText(primaryReportUrl)}
                          >
                            Copy URL
                          </button>
                          <Link
                            to="/reports"
                            className="rounded-lg border border-[#2f3336] px-3 py-2 text-sm text-[#1d9bf0] hover:bg-[#1a1f26]"
                          >
                            Reports library
                          </Link>
                        </div>
                        <p className="text-xs text-emerald-300/90">
                          Saved to <strong className="text-[#e7e9ea]">Reports</strong> in the sidebar.
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-[#8b98a5]">
                        Could not detect the main <code className="text-[#e7e9ea]">index.html</code> in the log. Check
                        console output below, or open{" "}
                        <code className="rounded bg-[#1a1f26] px-1">
                          {simulationFqn ? guessReportFolderHint(simulationFqn) : "build/reports/gatling/<run>/index.html"}
                        </code>{" "}
                        under the DarkKnight repo.
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8b98a5]">
                    Console output
                  </h3>
                  {jobLogText === "" && jobFinished ? (
                    <p className="text-sm text-amber-200/90">
                      No log text was returned for this job. Check DarkKnight logs or GET /jobs/{"{"}jobId{"}"} response.
                    </p>
                  ) : (
                    <pre className="max-h-[min(28rem,50vh)] overflow-auto rounded-lg bg-[#0f1419] p-3 font-mono text-xs leading-relaxed text-[#e7e9ea] ring-1 ring-[#2f3336]">
                      {outputOrJson(jobSnapshot)}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Flows help */}
          <section className="rounded-xl border border-[#2f3336] bg-[#1a1f26] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8b98a5]">Flows</h2>
            <ul className="mt-3 space-y-2">
              {FLOWS_HELP.map((f) => (
                <li key={f.id} className="flow-desc text-sm text-[#8b98a5]">
                  <span className="flow-id font-mono text-[#1d9bf0]">{f.id}</span> — {f.desc}
                </li>
              ))}
            </ul>
          </section>

          {/* Recent runs */}
          <section className="rounded-xl border border-[#2f3336] bg-[#1a1f26] p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8b98a5]">Recent runs (this session)</h2>
            {recent.length === 0 ? (
              <p className="runs-list mt-3 text-sm text-[#8b98a5]">No runs yet.</p>
            ) : (
              <ul className="runs-list mt-3 space-y-2">
                {recent.map((r) => (
                  <li
                    key={r.jobId + r.at}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#2f3336] bg-[#0f1419] px-3 py-2 font-mono text-xs"
                  >
                    <span className="text-[#e7e9ea]">{r.jobId}</span>
                    <span
                      className={`state-${statusToBadgeKind(r.status)} rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${badgeClasses(statusToBadgeKind(r.status))}`}
                    >
                      {r.status}
                    </span>
                    <span className="text-[#8b98a5]">{new Date(r.at).toLocaleTimeString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
