import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createFeature } from "./api";

export default function NewFeaturePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const f = await createFeature({ title, description: description || null });
      navigate(`/qa-dashboard/features/${f.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <p>
        <Link
          to="/qa-dashboard/features"
          className="text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
        >
          ← QA Dashboard
        </Link>
      </p>
      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">New feature</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        After you save, the feature page includes an <strong className="text-slate-800 dark:text-slate-200">Import from Excel</strong>{" "}
        section under Test cases.
      </p>
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80"
      >
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-inner dark:border-slate-600 dark:bg-slate-950/50 dark:text-slate-100"
            placeholder="e.g. Checkout — saved addresses"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-inner dark:border-slate-600 dark:bg-slate-950/50 dark:text-slate-100"
            placeholder="Context for reviewers (optional)"
          />
        </label>
        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 dark:bg-sky-600 dark:hover:bg-sky-500"
        >
          {saving ? "Creating…" : "Create"}
        </button>
      </form>
    </div>
  );
}
