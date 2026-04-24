package com.automationhub.orchestration;

import com.automationhub.domain.ExecutionRun;
import com.automationhub.domain.RunStatus;
import com.automationhub.domain.TestSuite;
import com.automationhub.engine.EngineRunResult;
import com.automationhub.engine.ExecutionContext;
import com.automationhub.engine.ExecutionEngineRegistry;
import com.automationhub.repo.ExecutionRunRepository;
import com.automationhub.reporting.RunEventPublisher;
import com.automationhub.web.dto.TriggerExecutionRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AsyncRunExecutor {

    private static final Logger log = LoggerFactory.getLogger(AsyncRunExecutor.class);

    private final SuiteCatalogService suiteCatalogService;
    private final ParameterResolver parameterResolver;
    private final ExecutionEngineRegistry executionEngineRegistry;
    private final ExecutionRunRepository executionRunRepository;
    private final RunEventPublisher runEventPublisher;
    private final ObjectMapper objectMapper;

    public AsyncRunExecutor(
            SuiteCatalogService suiteCatalogService,
            ParameterResolver parameterResolver,
            ExecutionEngineRegistry executionEngineRegistry,
            ExecutionRunRepository executionRunRepository,
            RunEventPublisher runEventPublisher,
            ObjectMapper objectMapper) {
        this.suiteCatalogService = suiteCatalogService;
        this.parameterResolver = parameterResolver;
        this.executionEngineRegistry = executionEngineRegistry;
        this.executionRunRepository = executionRunRepository;
        this.runEventPublisher = runEventPublisher;
        this.objectMapper = objectMapper;
    }

    @Async("taskExecutor")
    public void executeAfterCommit(String runId, TriggerExecutionRequest request) {
        ExecutionRun run = executionRunRepository.findById(runId).orElseThrow();
        try {
            List<TestSuite> suites = suiteCatalogService.resolveSuites(request);
            if (suites.isEmpty()) {
                failRun(run, "No suites matched PODs, layers, scope, and tag rules.");
                return;
            }
            run.setParametersJson(
                    suiteCatalogService.buildSuiteSummaryJson(
                            suites.stream().map(TestSuite::getId).collect(Collectors.toList())));
            run.setStatus(RunStatus.RUNNING);
            executionRunRepository.save(run);
            runEventPublisher.publishStatus(runId, RunStatus.RUNNING, "Resolved " + suites.size() + " suite(s)");

            ExecutionContext ctx = parameterResolver.buildContext(
                    runId,
                    request.environment(),
                    request.scope(),
                    suites,
                    request.extraParametersJson());

            StringBuilder logs = new StringBuilder();
            ArrayNode suiteResults = objectMapper.createArrayNode();
            boolean allOk = true;
            for (TestSuite suite : suites) {
                runEventPublisher.publishStatus(
                        runId, RunStatus.RUNNING, "Executing " + suite.getName() + " (" + suite.getType() + ")");
                EngineRunResult result =
                        executionEngineRegistry.get(suite.getType()).execute(suite, ctx);
                logs.append(result.logLines()).append(System.lineSeparator());
                ObjectNode one = objectMapper.createObjectNode();
                one.put("suiteId", suite.getId());
                one.put("type", suite.getType().name());
                one.put("success", result.success());
                one.put("detail", result.engineReportJson());
                suiteResults.add(one);
                if (!result.success()) {
                    allOk = false;
                }
            }
            ObjectNode summary = objectMapper.createObjectNode();
            summary.set("suiteResults", suiteResults);
            run.setLogSnippet(logs.toString());
            run.setResultSummaryJson(summary.toString());
            run.setStatus(allOk ? RunStatus.PASSED : RunStatus.FAILED);
            run.setEndTime(Instant.now());
            executionRunRepository.save(run);
            runEventPublisher.publishStatus(runId, run.getStatus(), "Completed");
        } catch (Exception e) {
            log.error("Run {} failed", runId, e);
            failRun(executionRunRepository.findById(runId).orElse(run), e.getMessage());
        }
    }

    private void failRun(ExecutionRun run, String message) {
        run.setStatus(RunStatus.FAILED);
        run.setEndTime(Instant.now());
        run.setLogSnippet(message);
        executionRunRepository.save(run);
        runEventPublisher.publishStatus(run.getId(), RunStatus.FAILED, message);
    }
}
