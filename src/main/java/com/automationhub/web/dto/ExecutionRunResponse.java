package com.automationhub.web.dto;

import com.automationhub.domain.DeploymentEnvironment;
import com.automationhub.domain.RunStatus;
import com.automationhub.domain.TestScope;

import java.time.Instant;

public record ExecutionRunResponse(
        String id,
        RunStatus status,
        String triggeredBy,
        Instant startTime,
        Instant endTime,
        DeploymentEnvironment environment,
        TestScope scope,
        String parametersJson,
        String logSnippet,
        String resultSummaryJson
) {}
