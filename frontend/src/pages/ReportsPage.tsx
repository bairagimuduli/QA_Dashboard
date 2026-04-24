import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadSavedReports, removeSavedReport, type SavedGatlingReport } from "../features/darkknight/savedReports";

export default function ReportsPage() {
  const [reports, setReports] = useState<SavedGatlingReport[]>(() => loadSavedReports());

  useEffect(() => {
    const onChange = () => setReports(loadSavedReports());
    window.addEventListener("gatling-reports-changed", onChange);
    return () => window.removeEventListener("gatling-reports-changed", onChange);
  }, []);

  return (
    <div className="min-h-full bg-[#0f1419] px-4 py-8 text-[#e7e9ea]">
      <div className="mx-auto max-w-[960px] space-y-6">
        <header className="border-b border-[#2f3336] pb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Gatling reports</h1>
          <p className="mt-2 text-sm text-[#8b98a5]">
            Reports from completed Performance Test runs are saved here (this browser only). Click a card to open the
            report viewer.
          </p>
        </header>

        {reports.length === 0 ? (
          <p className="rounded-xl border border-[#2f3336] bg-[#1a1f26] p-8 text-center text-sm text-[#8b98a5]">
            No saved reports yet. Run a simulation on{" "}
            <Link to="/dark-knight" className="text-[#1d9bf0] hover:underline">
              Performance Test
            </Link>{" "}
            and finish a job — the main HTML report is detected from the log and stored automatically.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/reports/${r.id}`}
                  className="group flex aspect-square max-h-[280px] flex-col rounded-2xl border border-[#2f3336] bg-[#1a1f26] p-5 transition hover:border-[#1d9bf0]/50 hover:shadow-lg hover:shadow-[#1d9bf0]/10"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8b98a5]">Report</span>
                  <span className="mt-3 line-clamp-3 flex-1 text-base font-medium leading-snug text-[#e7e9ea] group-hover:text-[#1d9bf0]">
                    {r.title}
                  </span>
                  <span className="mt-auto font-mono text-[10px] text-[#8b98a5] opacity-80">
                    {new Date(r.savedAt).toLocaleString()}
                  </span>
                </Link>
                <button
                  type="button"
                  className="mt-2 w-full text-center text-xs text-rose-300/80 hover:text-rose-200 hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    if (confirm("Remove this report from the list?")) removeSavedReport(r.id);
                    setReports(loadSavedReports());
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
