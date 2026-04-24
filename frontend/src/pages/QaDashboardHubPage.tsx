import { Link } from "react-router-dom";

const cards: { to: string; title: string; description: string; accent: string }[] = [
  {
    to: "/dark-knight",
    title: "Performance testing",
    description: "DarkKnight Gatling runs, injection profiles, and job output.",
    accent: "from-sky-500/20 to-indigo-500/10 ring-sky-500/30",
  },
  {
    to: "/qa-dashboard/mobile-ui",
    title: "Mobile UI automation",
    description: "Jenkins Mobile UI — Jenkinsfile & JenkinsfileTest last build and trigger.",
    accent: "from-violet-500/20 to-fuchsia-500/10 ring-violet-500/30",
  },
  {
    to: "/qa-dashboard/features",
    title: "Test case management",
    description: "Features, test cases, and handoff to automation.",
    accent: "from-amber-500/20 to-orange-500/10 ring-amber-500/30",
  },
  {
    to: "/reports",
    title: "Reports",
    description: "Saved Gatling HTML reports from completed runs (this browser).",
    accent: "from-emerald-500/20 to-teal-500/10 ring-emerald-500/30",
  },
];

export default function QaDashboardHubPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">QA Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Choose an area: performance runs, test-case workflow, or Gatling report library.
        </p>
      </div>
      <ul className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <li key={c.to}>
            <Link
              to={c.to}
              className={`group block h-full rounded-3xl border border-slate-200/80 bg-gradient-to-br p-6 shadow-sm ring-1 transition hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900/80 ${c.accent}`}
            >
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{c.title}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{c.description}</p>
              <span className="mt-4 inline-block text-sm font-medium text-rose-600 group-hover:underline dark:text-rose-400">
                Open →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
