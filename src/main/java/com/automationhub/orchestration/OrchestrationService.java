package com.automationhub.orchestration;

import com.automationhub.domain.ExecutionRun;
import com.automationhub.domain.RunStatus;
import com.automationhub.repo.ExecutionRunRepository;
import com.automationhub.web.dto.TriggerExecutionRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class OrchestrationService {

    private final ExecutionRunRepository executionRunRepository;
    private final ObjectMapper objectMapper;
    private final AsyncRunExecutor asyncRunExecutor;
    private final SuiteCatalogService suiteCatalogService;

    public OrchestrationService(
            ExecutionRunRepository executionRunRepository,
            ObjectMapper objectMapper,
            AsyncRunExecutor asyncRunExecutor,
            SuiteCatalogService suiteCatalogService) {
        this.executionRunRepository = executionRunRepository;
        this.objectMapper = objectMapper;
        this.asyncRunExecutor = asyncRunExecutor;
        this.suiteCatalogService = suiteCatalogService;
    }

    public String trigger(TriggerExecutionRequest request) {
        suiteCatalogService.validate(request);
        String id = UUID.randomUUID().toString();
        ExecutionRun run = new ExecutionRun();
        run.setId(id);
        run.setStatus(RunStatus.QUEUED);
        run.setTriggeredBy(request.triggeredBy() != null ? request.triggeredBy() : "anonymous");
        run.setStartTime(Instant.now());
        run.setEnvironment(request.environment());
        run.setScope(request.scope());
        run.setProfileId(request.profileId());
        try {
            ObjectNode params = objectMapper.createObjectNode();
            params.putPOJO("request", request);
            run.setParametersJson(objectMapper.writeValueAsString(params));
        } catch (JsonProcessingException e) {
            run.setParametersJson("{}");
        }
        executionRunRepository.save(run);
        asyncRunExecutor.executeAfterCommit(id, request);
        return id;
    }
}
