package com.automationhub.web.dto;

import com.automationhub.domain.RunStatus;
import com.automationhub.domain.TestType;

public record HeatmapCellResponse(
        Long podId,
        String podName,
        TestType testType,
        RunStatus lastRunStatus,
        String lastRunId
) {}
