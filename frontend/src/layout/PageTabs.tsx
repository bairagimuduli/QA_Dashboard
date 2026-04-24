import { Link, useLocation } from "react-router-dom";

const tabClass = (active: boolean) =>
  `rounded-t-lg px-3 py-2 text-sm font-medium transition ${
    active
      ? "bg-white text-rose-600 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-rose-400 dark:ring-slate-600"
      : "text-slate-500 hover:bg-white/60 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
  }`;

export function PageTabs() {
  const loc = useLocation();
  const p = loc.pathname;

  const overview = p === "/qa-dashboard";
  const insights = p === "/";
  const liveView = p.startsWith("/heatmap");
  const qaOps = p === "/qa" || (p.startsWith("/qa/") && !p.startsWith("/qa-dashboard"));
  const history = p.startsWith("/history");
  const perf = p.startsWith("/dark-knight");
  const mobileUi = p.startsWith("/qa-dashboard/mobile-ui");
  const testMgmt = p.startsWith("/qa-dashboard/features") || p.startsWith("/qa-dashboard/features/");
  const reports = p.startsWith("/reports");
  const wizard = p.startsWith("/wizard");

  return (
    <nav className="flex flex-wrap gap-1 border-b border-slate-200/80 bg-white/70 px-4 pt-2 dark:border-slate-700/80 dark:bg-slate-900/60 md:px-8">
      <span className="mr-1 hidden items-center rounded-t-lg px-2 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:inline">
        QA Dashboard
      </span>
      <Link to="/qa-dashboard" className={tabClass(overview)}>
        Home Page
      </Link>
      <Link to="/" className={tabClass(insights)}>
        Dashboard
      </Link>
      <Link to="/heatmap" className={tabClass(liveView)}>
        Live View
      </Link>
      <Link to="/qa" className={tabClass(qaOps)}>
        QA Ops
      </Link>
      <Link to="/history" className={tabClass(history)}>
        History
      </Link>
      <Link to="/dark-knight" className={tabClass(perf)}>
        Performance
      </Link>
      <Link to="/qa-dashboard/mobile-ui" className={tabClass(mobileUi)}>
        Mobile UI
      </Link>
      <Link to="/qa-dashboard/features" className={tabClass(testMgmt)}>
        Test cases
      </Link>
      <Link to="/reports" className={tabClass(reports)}>
        Reports
      </Link>
      <Link to="/wizard" className={tabClass(wizard)}>
        Wizard
      </Link>
    </nav>
  );
}
