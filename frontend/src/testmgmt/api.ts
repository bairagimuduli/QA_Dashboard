import type { Feature, TestCase } from "./types";

const jsonHeaders = { "Content-Type": "application/json" };

async function handle<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }
  const text = await res.text();
  let message = text || res.statusText;
  try {
    const j = JSON.parse(text) as { error?: string; message?: string; path?: string };
    if (typeof j.message === "string" && j.message.length > 0) {
      message = j.message;
    } else if (typeof j.error === "string") {
      message = j.path ? `${j.error} (${j.path})` : j.error;
    }
  } catch {
    /* keep raw message (HTML or plain text) */
  }
  throw new Error(message);
}

export function fetchFeatures(): Promise<Feature[]> {
  return fetch("/api/features").then((r) => handle<Feature[]>(r));
}

export function fetchFeature(id: number): Promise<Feature> {
  return fetch(`/api/features/${id}`).then((r) => handle<Feature>(r));
}

export function createFeature(body: { title: string; description?: string | null }): Promise<Feature> {
  return fetch("/api/features", {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  }).then((r) => handle<Feature>(r));
}

export function updateFeature(
  id: number,
  body: { title?: string; description?: string | null },
): Promise<Feature> {
  return fetch(`/api/features/${id}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  }).then((r) => handle<Feature>(r));
}

export function submitForReview(id: number): Promise<Feature> {
  return fetch(`/api/features/${id}/submit-for-review`, { method: "POST" }).then((r) => handle<Feature>(r));
}

export function approveForAutomation(id: number): Promise<Feature> {
  return fetch(`/api/features/${id}/approve-for-automation`, { method: "POST" }).then((r) => handle<Feature>(r));
}

export function addTestCase(
  featureId: number,
  body: {
    title: string;
    steps?: string | null;
    expectedResult?: string | null;
    priority?: string;
    sortOrder?: number | null;
  },
): Promise<TestCase> {
  return fetch(`/api/features/${featureId}/test-cases`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  }).then((r) => handle<TestCase>(r));
}

export function deleteTestCase(featureId: number, testCaseId: number): Promise<void> {
  return fetch(`/api/features/${featureId}/test-cases/${testCaseId}`, {
    method: "DELETE",
  }).then((r) => handle<void>(r));
}

export type ExcelImportResult = {
  feature: Feature;
  imported: number;
  skipped: number;
  messages: string[];
};

/** Multipart upload; appends rows as test cases on the feature (does not replace existing). */
export function importTestCasesFromExcel(featureId: number, file: File): Promise<ExcelImportResult> {
  const fd = new FormData();
  fd.append("file", file);
  return fetch(`/api/features/${featureId}/test-cases/import-excel`, {
    method: "POST",
    body: fd,
  }).then((r) => handle<ExcelImportResult>(r));
}

export const TEST_CASE_EXCEL_TEMPLATE_URL = "/api/features/test-case-excel-template";
