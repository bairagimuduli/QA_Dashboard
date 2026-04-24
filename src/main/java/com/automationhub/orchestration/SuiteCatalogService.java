package com.automationhub.orchestration;

import com.automationhub.domain.ExecutionProfile;
import com.automationhub.domain.TestScope;
import com.automationhub.domain.TestSuite;
import com.automationhub.domain.TestType;
import com.automationhub.repo.ExecutionProfileRepository;
import com.automationhub.repo.TestSuiteRepository;
import com.automationhub.web.dto.TriggerExecutionRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class SuiteCatalogService {

    private final TestSuiteRepository testSuiteRepository;
    private final ExecutionProfileRepository executionProfileRepository;
    private final TagExpressionParser tagExpressionParser;
    private final ObjectMapper objectMapper;

    public SuiteCatalogService(
            TestSuiteRepository testSuiteRepository,
            ExecutionProfileRepository executionProfileRepository,
            TagExpressionParser tagExpressionParser,
            ObjectMapper objectMapper) {
        this.testSuiteRepository = testSuiteRepository;
        this.executionProfileRepository = executionProfileRepository;
        this.tagExpressionParser = tagExpressionParser;
        this.objectMapper = objectMapper;
    }

    public void validate(TriggerExecutionRequest request) {
        boolean hasPods = !request.podIds().isEmpty();
        boolean hasProfile = request.profileId() != null;
        if (!hasPods && !hasProfile) {
            throw new IllegalArgumentException("Provide at least one POD or an execution profile.");
        }
    }

    public List<TestSuite> resolveSuites(TriggerExecutionRequest request) {
        List<Long> podIds = new ArrayList<>(request.podIds());
        List<TestType> types = new ArrayList<>(request.layers());
        if (request.profileId() != null) {
            ExecutionProfile profile =
                    executionProfileRepository.findById(request.profileId()).orElseThrow();
            podIds.addAll(readLongList(profile.getTargetPodIdsJson()));
            types.addAll(readTypes(profile.getTargetTypesJson()));
        }
        if (podIds.isEmpty()) {
            throw new IllegalArgumentException("Select at least one POD or an execution profile with POD targets.");
        }
        if (types.isEmpty()) {
            types.addAll(List.of(TestType.values()));
        }
        List<TestSuite> candidates = testSuiteRepository.findByPodIdInAndTypeIn(podIds, types);
        List<TestSuite> matched = new ArrayList<>();
        String expr = request.tagExpression();
        TestScope scope = request.scope();
        for (TestSuite suite : candidates) {
            if (tagExpressionParser.matches(suite, scope, expr)) {
                matched.add(suite);
            }
        }
        return matched;
    }

    public String buildSuiteSummaryJson(List<Long> suiteIds) {
        ArrayNode arr = objectMapper.createArrayNode();
        for (Long sid : suiteIds) {
            arr.add(sid);
        }
        ObjectNode root = objectMapper.createObjectNode();
        root.set("suiteIds", arr);
        return root.toString();
    }

    private List<Long> readLongList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(
                    json, objectMapper.getTypeFactory().constructCollectionType(List.class, Long.class));
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private List<TestType> readTypes(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            List<String> names = objectMapper.readValue(
                    json, objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
            List<TestType> out = new ArrayList<>();
            for (String n : names) {
                out.add(TestType.valueOf(n));
            }
            return out;
        } catch (Exception e) {
            return List.of();
        }
    }
}
