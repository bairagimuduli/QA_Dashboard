import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchFeatures, TEST_CASE_EXCEL_TEMPLATE_URL } from "./api";
import type { Feature, FeatureStatus } from "./types";

const statusLabel: Record<FeatureStatus, string> = {
  DRAFT: "Draft",
  PENDING_PRODUCT_REVIEW: "Pending product review",
  APPROVED_FOR_AUTOMATION: "Approved for automation",
};

const badge: Record<FeatureStatus, string> = {
  DRAFT: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
  PENDING_PRODUCT_REVIEW: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  APPROVED_FOR_AUTOMATION: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
};

export default function FeatureListPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatures()
      .then(setFeatures)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-400">Loading features…</p>;
  if (error)
    return (
      <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200">
        {error}
      </p>
    );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/90 px-4 py-3 text-sm text-indigo-950 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-950/35 dark:text-indigo-100">
        <p className="font-semibold">Import test cases from Excel</p>
        <p className="mt-1 text-indigo-900/90 dark:text-indigo-200/95">
          Open a feature below → on the feature page, find the <strong>Import from Excel</strong> card (indigo box) →{" "}
          <strong>Download template</strong> or <strong>Upload Excel…</strong>. Available while the feature is{" "}
          <strong>Draft</strong> or <strong>Pending review</strong> (not after approval).
        </p>
        <a
          href={TEST_CASE_EXCEL_TEMPLATE_URL}
          download="test-cases-template.xlsx"
          className="mt-2 inline-flex text-sm font-semibold text-indigo-700 underline decoration-indigo-400 underline-offset-2 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-100"
        >
          Download blank Excel template (no feature required)
        </a>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">QA Dashboard</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Features and test cases — draft, review, and hand off to automation (emails when SMTP is configured).
          </p>
        </div>
        <Link
          to="/qa-dashboard/features/new"
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500"
        >
          New feature
        </Link>
      </div>
      {features.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
          No features yet. Create one to add test cases.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {features.map((f) => (
            <li key={f.id}>
              <Link
                to={`/qa-dashboard/features/${f.id}`}
                className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-sky-200 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900/80 dark:hover:border-sky-600"
              >
                <span className="font-semibold text-slate-900 dark:text-slate-100">{f.title}</span>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge[f.status]}`}>
                    {statusLabel[f.status]}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{f.testCases.length} test case(s)</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
