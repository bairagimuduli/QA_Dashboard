import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchMobileUiJenkinsSummary,
  fetchParameterDefinitions,
  fetchRunStatus,
  triggerMobileUiBuild,
  type JenkinsParameterField,
  type MobileUiJenkinsSummary,
  type MobileUiRunStatus,
} from "./jenkinsApi";

const POLL_MS = 3_000;

type PipelineKey = "jenkinsfile" | "jenkinsfileTest";

function isTerminalPhase(s: MobileUiRunStatus): boolean {
  return s.phase === "COMPLETED" || s.phase === "FAILED";
}

export default function MobileUiAutomationPage() {
  const [summary, setSummary] = useState<MobileUiJenkinsSummary | null>(null);
  const [summaryErr, setSummaryErr] = useState<string | null>(null);

  const [pipeline, setPipeline] = useState<PipelineKey>("jenkinsfile");
  const [fields, setFields] = useState<JenkinsParameterField[]>([]);
  const [params, setParams] = useState<Record<string, string>>({});
  const [defsErr, setDefsErr] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [polling, setPolling] = useState(false);
  const [queueId, setQueueId] = useState<number | null>(null);
  const [jobFullName, setJobFullName] = useState<string | null>(null);
  const [buildNumber, setBuildNumber] = useState<number | null>(null);
  const [status, setStatus] = useState<MobileUiRunStatus | null>(null);

  useEffect(() => {
    fetchMobileUiJenkinsSummary()
      .then((s) => {
        setSummary(s);
        setSummaryErr(null);
      })
      .catch((e: Error) => setSummaryErr(e.message));
  }, []);

  useEffect(() => {
    setDefsErr(null);
    fetchParameterDefinitions(pipeline)
      .then((d) => {
        setFields(d.parameters);
        const next: Record<string, string> = {};
        for (const f of d.parameters) {
          next[f.name] = (f.defaultValue || f.choices[0] || "").trim();
        }
        setParams(next);
      })
      .catch((e: Error) => setDefsErr(e.message));
  }, [pipeline]);

  useEffect(() => {
    if (!polling) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const s =
          jobFullName != null && buildNumber != null
            ? await fetchRunStatus({ jobFullName, buildNumber })
            : queueId != null
              ? await fetchRunStatus({ queueItemId: queueId })
              : null;
        if (cancelled || !s) return;
        setStatus(s);
        if (isTerminalPhase(s)) {
          setPolling(false);
          return;
        }
        if (queueId != null && s.jobFullName && s.buildNumber != null) {
          setJobFullName(s.jobFullName);
          setBuildNumber(s.buildNumber);
          setQueueId(null);
        }
      } catch (e: unknown) {
        if (cancelled) return;
        setStatus({
          phase: "FAILED",
          message: e instanceof Error ? e.message : String(e),
          jobFullName: null,
          buildNumber: null,
          buildUrl: null,
          building: null,
          result: null,
          durationMs: null,
          timestamp: null,
          consoleTail: null,
          buildParameters: {},
        });
        setPolling(false);
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [polling, queueId, jobFullName, buildNumber]);

  const onTrigger = async () => {
    setBusy(true);
    setStatus(null);
    setQueueId(null);
    setJobFullName(null);
    setBuildNumber(null);
    setPolling(false);
    try {
      const res = await triggerMobileUiBuild({ pipeline, parameters: params });
      setQueueId(res.queueItemId);
      setPolling(true);
    } catch (e: unknown) {
      setStatus({
        phase: "FAILED",
        message: e instanceof Error ? e.message : String(e),
        jobFullName: null,
        buildNumber: null,
        buildUrl: null,
        building: null,
        result: null,
        durationMs: null,
        timestamp: null,
        consoleTail: null,
        buildParameters: {},
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Mobile UI automation</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
          Trigger Jenkins parameterized builds for the Mobile UI pipelines (Jenkinsfile / JenkinsfileTest). For Gatling
          performance runs, use{" "}
          <Link to="/dark-knight" className="font-medium text-rose-600 hover:underline dark:text-rose-400">
            Performance Test
          </Link>
          .
        </p>
      </div>

      {summaryErr ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100">
          {summaryErr}
        </div>
      ) : null}

      {summary && !summary.credentialsConfigured ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          Jenkins credentials are not configured on the hub. Set <code className="text-xs">JENKINS_USERNAME</code> and{" "}
          <code className="text-xs">JENKINS_API_TOKEN</code> (or <code className="text-xs">jenkins.*</code> in{" "}
          <code className="text-xs">application-local.yml</code>), then restart Spring Boot.
        </div>
      ) : null}

      {summary ? (
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/60">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Pipeline status</h2>
          <p className="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">{summary.jenkinsBaseUrl}</p>
          <ul className="mt-4 space-y-3">
            {summary.pipelines.map((p) => (
              <li
                key={p.key}
                className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <div className="font-medium text-slate-900 dark:text-slate-100">{p.title}</div>
                <div className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-400">{p.jobFullName}</div>
                {p.error ? (
                  <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{p.error}</p>
                ) : p.lastBuild ? (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Last #{p.lastBuild.number} — {p.lastBuild.result || (p.lastBuild.building ? "building" : "—")}{" "}
                    {p.lastBuild.building ? <span className="text-amber-600">(running)</span> : null}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No last build</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/60">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Trigger build</h2>
        {defsErr ? (
          <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{defsErr}</p>
        ) : null}

        <label className="mt-4 block text-sm font-medium text-slate-700 dark:text-slate-200">
          Pipeline
          <select
            className="mt-1 w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            value={pipeline}
            onChange={(e) => setPipeline(e.target.value as PipelineKey)}
          >
            <option value="jenkinsfile">Jenkinsfile (scheduled)</option>
            <option value="jenkinsfileTest">JenkinsfileTest</option>
          </select>
        </label>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <label key={f.name} className="block text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">{f.name}</span>
              {f.choices.length > 0 ? (
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={params[f.name] ?? ""}
                  onChange={(e) => setParams((prev) => ({ ...prev, [f.name]: e.target.value }))}
                >
                  {f.choices.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  value={params[f.name] ?? ""}
                  onChange={(e) => setParams((prev) => ({ ...prev, [f.name]: e.target.value }))}
                />
              )}
            </label>
          ))}
        </div>

        <button
          type="button"
          disabled={busy || !summary?.credentialsConfigured || fields.length === 0}
          onClick={() => void onTrigger()}
          className="mt-6 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-rose-700 disabled:opacity-50"
        >
          {busy ? "Queuing…" : "Trigger build"}
        </button>
      </section>

      {status ? (
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/60">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Run status</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium">Phase:</span> {status.phase}
            {polling ? <span className="ml-2 text-amber-600 dark:text-amber-400">polling…</span> : null}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{status.message}</p>
          {status.buildUrl ? (
            <a
              href={status.buildUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
            >
              Open in Jenkins
            </a>
          ) : null}
          {status.consoleTail ? (
            <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
              {status.consoleTail}
            </pre>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
