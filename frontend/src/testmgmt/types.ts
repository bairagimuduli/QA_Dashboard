export type FeatureStatus = "DRAFT" | "PENDING_PRODUCT_REVIEW" | "APPROVED_FOR_AUTOMATION";

export interface TestCase {
  id: number;
  title: string;
  steps: string | null;
  expectedResult: string | null;
  priority: string;
  sortOrder: number;
}

export interface Feature {
  id: number;
  title: string;
  description: string | null;
  status: FeatureStatus;
  createdAt: string;
  updatedAt: string;
  testCases: TestCase[];
}
