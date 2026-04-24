package com.automationhub.engine;

import com.automationhub.domain.DeploymentEnvironment;
import com.automationhub.domain.TestScope;

import java.util.Map;

/**
 * Resolved parameters and secrets (placeholders) passed into a concrete execution engine.
 */
public record ExecutionContext(
        String runId,
        DeploymentEnvironment environment,
        TestScope scope,
        String workspaceRoot,
        Map<String, String> resolvedEnv,
        String extraParametersJson
) {}
