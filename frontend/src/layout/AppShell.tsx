import { Outlet, useLocation } from "react-router-dom";
import { PageTabs } from "./PageTabs";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell() {
  const location = useLocation();
  const path = location.pathname;
  const isFullBleedDark =
    path === "/dark-knight" || path === "/reports" || path.startsWith("/reports/");
  const showDashboardHeading = !isFullBleedDark && path !== "/qa-dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-[#f3eef7] transition-colors dark:bg-slate-950">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar />
        <PageTabs />
        {isFullBleedDark ? (
          <div className="flex-1 overflow-auto">
            <Outlet />
          </div>
        ) : (
          <div className="flex-1 overflow-auto px-8 py-6">
            {showDashboardHeading && (
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h1>
                <p className="max-w-xl text-sm text-slate-500 dark:text-slate-400">
                  Unified QA insights: automation runs, POD × layer health, and QA Dashboard (features & test cases) in one place.
                </p>
              </div>
            )}
            <Outlet />
          </div>
        )}
      </div>
    </div>
  );
}
