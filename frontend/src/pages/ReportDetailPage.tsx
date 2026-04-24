import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getSavedReport, type SavedGatlingReport } from "../features/darkknight/savedReports";

export default function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const [report, setReport] = useState<SavedGatlingReport | null | undefined>(undefined);

  useEffect(() => {
    const load = () => {
      if (!reportId) {
        setReport(null);
        return;
      }
      setReport(getSavedReport(reportId) ?? null);
    };
    load();
    window.addEventListener("gatling-reports-changed", load);
    return () => window.removeEventListener("gatling-reports-changed", load);
  }, [reportId]);

  const isHttp = useMemo(() => {
    if (!report?.fileUrl) return false;
    return /^https?:\/\//i.test(report.fileUrl);
  }, [report?.fileUrl]);

  if (report === undefined) {
    return (
      <div className="min-h-full bg-[#0f1419] px-4 py-16 text-center text-[#8b98a5]">
        Loading…
      </div>
    );
  }

  if (!report) {
    return <Navigate to="/reports" replace />;
  }

  return (
    <div className="min-h-full bg-[#0f1419] px-4 py-8 text-[#e7e9ea]">
      <div className="mx-auto max-w-[960px] space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/reports"
            className="text-sm font-medium text-[#1d9bf0] hover:underline"
          >
            ← All reports
          </Link>
        </div>

        <header>
          <h1 className="text-xl font-semibold text-[#e7e9ea]">{report.title}</h1>
          <p className="mt-1 font-mono text-xs text-[#8b98a5]">{report.fileUrl}</p>
        </header>

        <div className="flex flex-wrap gap-3">
          <a
            href={report.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-[#1d9bf0] px-6 py-3 text-sm font-semibold text-[#0f1419] transition hover:bg-[#47a9f2]"
          >
            View report
          </a>
          <button
            type="button"
            className="rounded-xl border border-[#2f3336] px-4 py-3 text-sm font-medium text-[#e7e9ea] hover:bg-[#1a1f26]"
            onClick={() => void navigator.clipboard.writeText(report.fileUrl)}
          >
            Copy file URL
          </button>
        </div>

        <p className="text-sm text-[#8b98a5]">
          Local <code className="text-[#1d9bf0]">file://</code> pages may not load inside the browser from this app for
          security reasons. Use <strong className="text-[#e7e9ea]">View report</strong> to open the HTML in a new tab, or
          paste the path in Chrome/Edge.
        </p>

        {isHttp ? (
          <div className="overflow-hidden rounded-xl border border-[#2f3336] bg-white">
            <iframe
              title="Gatling report"
              src={report.fileUrl}
              className="h-[min(70vh,800px)] w-full"
              sandbox="allow-scripts allow-same-origin allow-popups allow-downloads"
            />
          </div>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-[#2f3336] bg-[#1a1f26] p-8 text-center">
            <p className="max-w-md text-sm text-[#8b98a5]">
              In-app preview is only available for HTTP(S) report URLs. For local Gatling output, click{" "}
              <strong className="text-[#e7e9ea]">View report</strong> above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
