export type TestScope = "SMOKE" | "SANITY" | "REGRESSION" | "FULL";
export type DeploymentEnvironment = "DEV" | "STAGING" | "PRODUCTION";
export type TestType = "API" | "WEB" | "MOBILE" | "PERFORMANCE";
export type RunStatus = "QUEUED" | "RUNNING" | "PASSED" | "FAILED" | "CANCELLED";

export type Pod = { id: number; name: string; owner: string | null };
export type TestSuite = {
  id: number;
  name: string;
  description: string | null;
  podId: number;
  type: TestType;
  repositoryUrl: string | null;
  tags: string[];
};
export type ExecutionProfile = {
  id: number;
  name: string;
  targetTags: string | null;
  targetPodIdsJson: string | null;
  targetTypesJson: string | null;
};

export type TriggerPayload = {
  scope: TestScope;
  environment: DeploymentEnvironment;
  podIds: number[];
  layers: TestType[];
  profileId: number | null;
  tagExpression: string | null;
  triggeredBy: string | null;
  extraParametersJson: string | null;
};

export type ExecutionRun = {
  id: string;
  status: RunStatus;
  triggeredBy: string | null;
  startTime: string | null;
  endTime: string | null;
  environment: DeploymentEnvironment | null;
  scope: TestScope | null;
  parametersJson: string | null;
  logSnippet: string | null;
  resultSummaryJson: string | null;
};

export type HeatmapCell = {
  podId: number;
  podName: string;
  testType: TestType;
  lastRunStatus: RunStatus;
  lastRunId: string | null;
};
