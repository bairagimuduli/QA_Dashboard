package com.automationhub.orchestration;

import com.automationhub.config.OrchestrationProperties;
import com.automationhub.domain.DeploymentEnvironment;
import com.automationhub.domain.Pod;
import com.automationhub.domain.TestScope;
import com.automationhub.domain.TestSuite;
import com.automationhub.engine.ExecutionContext;
import com.automationhub.repo.PodRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class ParameterResolver {

    private final PodRepository podRepository;
    private final OrchestrationProperties orchestrationProperties;
    private final ObjectMapper objectMapper;

    public ParameterResolver(
            PodRepository podRepository,
            OrchestrationProperties orchestrationProperties,
            ObjectMapper objectMapper) {
        this.podRepository = podRepository;
        this.orchestrationProperties = orchestrationProperties;
        this.objectMapper = objectMapper;
    }

    public ExecutionContext buildContext(
            String runId, DeploymentEnvironment environment, TestScope scope, List<TestSuite> suites, String extraJson) {
        Map<String, String> env = new HashMap<>();
        env.put("DEPLOYMENT_ENV", environment.name());
        env.put("TEST_SCOPE", scope.name());
        for (Long podId : suites.stream().map(TestSuite::getPodId).distinct().collect(Collectors.toList())) {
            Pod pod = podRepository.findById(podId).orElse(null);
            if (pod != null && pod.getEnvVarsJson() != null && !pod.getEnvVarsJson().isBlank()) {
                mergeJson(env, pod.getEnvVarsJson());
            }
        }
        return new ExecutionContext(
                runId,
                environment,
                scope,
                orchestrationProperties.getWorkspaceRoot(),
                Map.copyOf(env),
                extraJson);
    }

    private void mergeJson(Map<String, String> target, String json) {
        try {
            Map<String, String> chunk = objectMapper.readValue(json, new TypeReference<>() {});
            target.putAll(chunk);
        } catch (IOException ignored) {
            // Invalid POD env JSON is skipped; operators fix catalog data
        }
    }
}
