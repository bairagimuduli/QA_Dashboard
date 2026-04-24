import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  addTestCase,
  approveForAutomation,
  deleteTestCase,
  fetchFeature,
  importTestCasesFromExcel,
  submitForReview,
  TEST_CASE_EXCEL_TEMPLATE_URL,
  updateFeature,
} from "./api";
import type { Feature, FeatureStatus } from "./types";

const statusLabel: Record<FeatureStatus, string> = {
  DRAFT: "Draft",
  PENDING_PRODUCT_REVIEW: "Pending product review",
  APPROVED_FOR_AUTOMATION: "Approved for automation",
};

export default function FeatureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const featureId = Number(id);
  const [feature, setFeature] = useState<Feature | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [tcTitle, setTcTitle] = useState("");
  const [tcSteps, setTcSteps] = useState("");
  const [tcExpected, setTcExpected] = useState("");
  const [tcPriority, setTcPriority] = useState("MEDIUM");
  const [busy, setBusy] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  function reload() {
    if (!Number.isFinite(featureId)) return Promise.resolve();
    return fetchFeature(featureId).then(setFeature).catch((e: Error) => setError(e.message));
  }

  useEffect(() => {
    if (!Number.isFinite(featureId)) {
      setLoading(false);
      setError("Invalid feature id");
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchFeature(featureId)
      .then((f) => {
        if (!cancelled) setFeature(f);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [featureId]);

  useEffect(() => {
    if (feature) {
      setEditTitle(feature.title);
      setEditDescription(feature.description ?? "");
    }
  }, [feature]);

  const editable = feature?.status !== "APPROVED_FOR_AUTOMATION";

  async function saveMeta(e: FormEvent) {
    e.preventDefault();
    if (!feature) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateFeature(feature.id, {
        title: editTitle,
        description: editDescription || null,
      });
      setFeature(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function onAddTestCase(e: FormEvent) {
    e.preventDefault();
    if (!feature) return;
    setBusy(true);
    setError(null);
    try {
      await addTestCase(feature.id, {
        title: tcTitle,
        steps: tcSteps || null,
        expectedResult: tcExpected || null,
        priority: tcPriority,
      });
      setTcTitle("");
      setTcSteps("");
      setTcExpected("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add test case");
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteTc(testCaseId: number) {
    if (!feature || !confirm("Delete this test case?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteTestCase(feature.id, testCaseId);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmitReview() {
    if (!feature) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await submitForReview(feature.id);
      setFeature(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  async function onExcelFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !feature) return;
    setBusy(true);
    setError(null);
    setImportSummary(null);
    try {
      const res = await importTestCasesFromExcel(feature.id, file);
      setFeature(res.feature);
      let msg = `Imported ${res.imported} test case(s).`;
      if (res.skipped > 0) {
        msg += ` ${res.skipped} row(s) were not added.`;
      }
      if (res.messages.length > 0) {
        msg += ` ${res.messages.join(" ")}`;
      }
      setImportSummary(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Excel import failed");
    } finally {
      setBusy(false);
    }
  }

  async function onApprove() {
    if (!feature) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await approveForAutomation(feature.id);
      setFeature(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>;
  if (error && !feature) return <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>;
  if (!feature) return null;

  return (
    <div className="space-y-6">
      <p>
        <Link
          to="/qa-dashboard/features"
          className="text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
        >
          ← QA Dashboard
        </Link>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{feature.title}</h2>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {statusLabel[feature.status]}
        </span>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Feature details</h3>
        {editable ? (
          <form onSubmit={saveMeta} className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Title
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950/50 dark:text-slate-100"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Description
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950/50 dark:text-slate-100"
              />
            </label>
            <button
              type="submit"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-600 dark:text-slate-200"
              disabled={busy}
            >
              Save details
            </button>
          </form>
        ) : (
          <>
            {feature.description && <p className="mt-2 text-slate-600 dark:text-slate-300">{feature.description}</p>}
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Locked after approval for automation.</p>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Workflow</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600 dark:text-slate-400">
          <li
            className={
              feature.status === "DRAFT" ? "font-semibold text-slate-900 dark:text-slate-100" : ""
            }
          >
            QA drafts test cases
          </li>
          <li
            className={
              feature.status === "PENDING_PRODUCT_REVIEW" ? "font-semibold text-slate-900 dark:text-slate-100" : ""
            }
          >
            Product review (email when configured)
          </li>
          <li
            className={
              feature.status === "APPROVED_FOR_AUTOMATION" ? "font-semibold text-slate-900 dark:text-slate-100" : ""
            }
          >
            Automation handoff
          </li>
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          {feature.status === "DRAFT" && (
            <button
              type="button"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-sky-600"
              disabled={busy}
              onClick={onSubmitReview}
            >
              Submit for product review
            </button>
          )}
          {feature.status === "PENDING_PRODUCT_REVIEW" && (
            <button
              type="button"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
              disabled={busy}
              onClick={onApprove}
            >
              Approve for automation (product)
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Test cases</h3>

        <div className="mt-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/90 p-4 dark:border-indigo-500/40 dark:bg-indigo-950/40">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white dark:bg-indigo-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-indigo-950 dark:text-indigo-100">Import from Excel</p>
              <p className="mt-1 text-xs text-indigo-900/80 dark:text-indigo-200/90">
                Row 1 = column headers. Required: a <strong>Title</strong> column (&quot;Title&quot;, &quot;Test case&quot;,
                or &quot;Summary&quot;). Optional: Steps, Expected result, Priority. Files: <strong>.xlsx</strong> or{" "}
                <strong>.xls</strong>. New rows append after existing test cases.
              </p>
              {editable ? (
                <>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <a
                      href={TEST_CASE_EXCEL_TEMPLATE_URL}
                      download="test-cases-template.xlsx"
                      className="inline-flex rounded-lg border border-indigo-300 bg-white px-3 py-2 text-sm font-medium text-indigo-900 shadow-sm hover:bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-900 dark:text-indigo-100 dark:hover:bg-indigo-800"
                    >
                      Download template
                    </a>
                    <input
                      ref={excelInputRef}
                      type="file"
                      accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      className="hidden"
                      onChange={onExcelFileChange}
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => excelInputRef.current?.click()}
                      className="inline-flex rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                    >
                      Upload Excel…
                    </button>
                  </div>
                  {importSummary && (
                    <p className="mt-3 text-sm font-medium text-emerald-800 dark:text-emerald-300">{importSummary}</p>
                  )}
                </>
              ) : (
                <p className="mt-3 rounded-lg bg-amber-100/90 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/50 dark:text-amber-100">
                  Excel import is turned off after <strong>Approved for automation</strong>. Test cases are frozen for
                  this feature.
                </p>
              )}
            </div>
          </div>
        </div>
        {editable && (
          <form
            onSubmit={onAddTestCase}
            className="mt-4 space-y-4 border-b border-slate-100 pb-6 dark:border-slate-800"
          >
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Add test case</p>
            <label className="block text-sm text-slate-700 dark:text-slate-300">
              Title
              <input
                value={tcTitle}
                onChange={(e) => setTcTitle(e.target.value)}
                required
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950/50 dark:text-slate-100"
              />
            </label>
            <label className="block text-sm text-slate-700 dark:text-slate-300">
              Steps
              <textarea
                value={tcSteps}
                onChange={(e) => setTcSteps(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950/50 dark:text-slate-100"
              />
            </label>
            <label className="block text-sm text-slate-700 dark:text-slate-300">
              Expected result
              <textarea
                value={tcExpected}
                onChange={(e) => setTcExpected(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950/50 dark:text-slate-100"
              />
            </label>
            <label className="block text-sm text-slate-700 dark:text-slate-300">
              Priority
              <select
                value={tcPriority}
                onChange={(e) => setTcPriority(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-950/50 dark:text-slate-100"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-600 dark:text-slate-200"
              disabled={busy}
            >
              Add test case
            </button>
          </form>
        )}

        {feature.testCases.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No test cases yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {feature.testCases.map((tc) => (
              <li
                key={tc.id}
                className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-slate-900 dark:text-slate-100">{tc.title}</strong>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {tc.priority}
                  </span>
                  {editable && (
                    <button
                      type="button"
                      className="ml-auto text-xs font-semibold text-rose-600 hover:underline dark:text-rose-400"
                      disabled={busy}
                      onClick={() => onDeleteTc(tc.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
                {tc.steps && (
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="text-xs font-semibold uppercase text-slate-400">Steps</span>
                    <pre className="mt-1 whitespace-pre-wrap font-sans">{tc.steps}</pre>
                  </div>
                )}
                {tc.expectedResult && (
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="text-xs font-semibold uppercase text-slate-400">Expected</span>
                    <p className="mt-1">{tc.expectedResult}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
