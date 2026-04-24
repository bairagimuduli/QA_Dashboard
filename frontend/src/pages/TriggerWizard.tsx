import { useEffect, useMemo, useState } from "react";
import { ENVS, LAYERS, SCOPES, fetchPods, fetchProfiles, triggerRun } from "../api/client";
import type { DeploymentEnvironment, Pod, TestScope, TestType, TriggerPayload } from "../api/types";

type Step = 1 | 2 | 3 | 4;

export default function TriggerWizard() {
  const [step, setStep] = useState<Step>(1);
  const [pods, setPods] = useState<Pod[]>([]);
  const [profiles, setProfiles] = useState<{ id: number; name: string }[]>([]);
  const [scope, setScope] = useState<TestScope>("SMOKE");
  const [environment, setEnvironment] = useState<DeploymentEnvironment>("STAGING");
  const [selectedPods, setSelectedPods] = useState<number[]>([]);
  const [layers, setLayers] = useState<TestType[]>(["API"]);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [tagExpression, setTagExpression] = useState("");
  const [triggeredBy, setTriggeredBy] = useState("qa-dashboard");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, pr] = await Promise.all([fetchPods(), fetchProfiles()]);
        setPods(p);
        setProfiles(pr.map((x) => ({ id: x.id, name: x.name })));
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load catalog");
      }
    })();
  }, []);

  const canNext = useMemo(() => {
    if (step === 1) return true;
    if (step === 2) return selectedPods.length > 0 || profileId != null;
    if (step === 3) return layers.length > 0;
    return true;
  }, [step, selectedPods, profileId, layers]);

  function togglePod(id: number) {
    setSelectedPods((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  function toggleLayer(l: TestType) {
    setLayers((prev) => (prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]));
  }

  async function submit() {
    setBusy(true);
    setErr(null);
    setResult(null);
    const body: TriggerPayload = {
      scope,
      environment,
      podIds: selectedPods,
      layers,
      profileId,
      tagExpression: tagExpression.trim() || null,
      triggeredBy,
      extraParametersJson: null,
    };
    try {
      const res = await triggerRun(body);
      setResult(res.runId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Trigger failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Unified trigger wizard</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Scope, PODs, layers, environment. Wire engines to Gradle, Jenkins, or remote agents from the backend.
        </p>
      </div>

      <ol className="flex flex-wrap gap-2 text-sm">
        {[
          ["1 · Scope", 1],
          ["2 · PODs", 2],
          ["3 · Layers", 3],
          ["4 · Environment", 4],
        ].map(([label, s]) => (
          <li key={String(s)}>
            <button
              type="button"
              onClick={() => setStep(s as Step)}
              className={`rounded-full px-3 py-1 ring-1 ${
                step === s
                  ? "bg-sky-600 text-white ring-sky-400"
                  : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-600 dark:hover:bg-slate-700"
              }`}
            >
              {label}
            </button>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900">Step 1 — Test scope</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {SCOPES.map((s) => (
                <label
                  key={s}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ring-1 ${
                    scope === s
                      ? "border-sky-500 bg-sky-50 ring-sky-200"
                      : "border-slate-200 bg-white ring-slate-100 dark:border-slate-600 dark:bg-slate-950/50 dark:ring-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    checked={scope === s}
                    onChange={() => setScope(s)}
                    className="accent-sky-600"
                  />
                  <span className="text-slate-800">{s}</span>
                </label>
              ))}
            </div>
            <label className="block text-sm text-slate-600">
              Tag expression (optional)
              <input
                value={tagExpression}
                onChange={(e) => setTagExpression(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950/50 dark:text-slate-100"
                placeholder="@smoke AND NOT @flaky"
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900">Step 2 — POD targeting</h3>
            <div className="grid gap-2">
              {pods.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedPods.includes(p.id)}
                    onChange={() => togglePod(p.id)}
                    className="accent-sky-600"
                  />
                  <span className="text-slate-800">{p.name}</span>
                  <span className="text-xs text-slate-500">{p.owner}</span>
                </label>
              ))}
            </div>
            <label className="block text-sm text-slate-600">
              Execution profile (optional)
              <select
                value={profileId ?? ""}
                onChange={(e) => setProfileId(e.target.value ? Number(e.target.value) : null)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950/50 dark:text-slate-100"
              >
                <option value="">— none —</option>
                {profiles.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900">Step 3 — Layer targeting</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {LAYERS.map((l) => (
                <label
                  key={l}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ring-1 ${
                    layers.includes(l)
                      ? "border-sky-500 bg-sky-50 ring-sky-200"
                      : "border-slate-200 bg-white ring-slate-100 dark:border-slate-600 dark:bg-slate-950/50 dark:ring-slate-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={layers.includes(l)}
                    onChange={() => toggleLayer(l)}
                    className="accent-sky-600"
                  />
                  <span className="text-slate-800">{l}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900">Step 4 — Environment and trigger</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {ENVS.map((e) => (
                <label
                  key={e}
                  className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-3 ring-1 ${
                    environment === e
                      ? "border-amber-400 bg-amber-50 ring-amber-200"
                      : "border-slate-200 bg-white ring-slate-100 dark:border-slate-600 dark:bg-slate-950/50 dark:ring-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="env"
                    checked={environment === e}
                    onChange={() => setEnvironment(e)}
                    className="accent-amber-500"
                  />
                  <span className="ml-2 text-slate-800">{e}</span>
                </label>
              ))}
            </div>
            <label className="block text-sm text-slate-600">
              Triggered by
              <input
                value={triggeredBy}
                onChange={(e) => setTriggeredBy(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950/50 dark:text-slate-100"
              />
            </label>
            <button
              type="button"
              disabled={busy || !canNext}
              onClick={submit}
              className="w-full rounded-xl bg-sky-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Submitting" : "Execute"}
            </button>
            {result && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                Run queued: <span className="font-mono">{result}</span>
              </p>
            )}
            {err && <p className="text-sm text-rose-600">{err}</p>}
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          disabled={step === 1}
          onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          disabled={step === 4 || !canNext}
          onClick={() => setStep((s) => (s < 4 ? ((s + 1) as Step) : s))}
          className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
