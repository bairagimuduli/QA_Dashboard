package com.automationhub.web.dto;

public record DashboardSummaryResponse(
        RunSummary runs,
        HeatmapSummary heatmap,
        FeaturePipelineSummary features
) {
    public record RunSummary(long passed, long failed, long running, long queued, long total) {}

    public record HeatmapSummary(int cells, long passedCells, long failedCells, long pendingCells) {}

    public record FeaturePipelineSummary(long draft, long pendingReview, long approved, long total) {}
}
