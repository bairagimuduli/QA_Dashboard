export type SavedGatlingReport = {
  id: string;
  jobId: string | null;
  title: string;
  fileUrl: string;
  simulationClass?: string;
  savedAt: string;
};
