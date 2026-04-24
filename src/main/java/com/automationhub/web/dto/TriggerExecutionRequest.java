package com.automationhub.web.dto;

import com.automationhub.domain.DeploymentEnvironment;
import com.automationhub.domain.TestScope;
import com.automationhub.domain.TestType;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record TriggerExecutionRequest(
        @NotNull TestScope scope,
        @NotNull DeploymentEnvironment environment,
        List<Long> podIds,
        List<TestType> layers,
        Long profileId,
        String tagExpression,
        String triggeredBy,
        String extraParametersJson
) {
    public TriggerExecutionRequest {
        if (podIds == null) {
            podIds = List.of();
        }
        if (layers == null) {
            layers = List.of();
        }
    }
}
