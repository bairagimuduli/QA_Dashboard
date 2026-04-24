import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./layout/AppShell";
import HeatmapPage from "./pages/HeatmapPage";
import HistoryPage from "./pages/HistoryPage";
import InsightsDashboard from "./pages/InsightsDashboard";
import DarkKnightPage from "./pages/DarkKnightPage";
import ReportDetailPage from "./pages/ReportDetailPage";
import ReportsPage from "./pages/ReportsPage";
import QaOperationsPage from "./pages/QaOperationsPage";
import TriggerWizard from "./pages/TriggerWizard";
import FeatureDetailPage from "./testmgmt/FeatureDetailPage";
import FeatureListPage from "./testmgmt/FeatureListPage";
import NewFeaturePage from "./testmgmt/NewFeaturePage";
import QaDashboardHubPage from "./pages/QaDashboardHubPage";
import MobileUiAutomationPage from "./features/mobileui/MobileUiAutomationPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<InsightsDashboard />} />
        <Route path="qa" element={<QaOperationsPage />} />
        <Route path="dark-knight" element={<DarkKnightPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="reports/:reportId" element={<ReportDetailPage />} />
        <Route path="wizard" element={<TriggerWizard />} />
        <Route path="heatmap" element={<HeatmapPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="qa-dashboard">
          <Route index element={<QaDashboardHubPage />} />
          <Route path="mobile-ui" element={<MobileUiAutomationPage />} />
          <Route path="features" element={<FeatureListPage />} />
          <Route path="features/new" element={<NewFeaturePage />} />
          <Route path="features/:id" element={<FeatureDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
