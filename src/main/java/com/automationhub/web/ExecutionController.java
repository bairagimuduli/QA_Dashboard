package com.automationhub.web;

import com.automationhub.orchestration.OrchestrationService;
import com.automationhub.reporting.ReportingService;
import com.automationhub.web.dto.ExecutionRunResponse;
import com.automationhub.web.dto.TriggerExecutionRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/runs")
public class ExecutionController {

    private final OrchestrationService orchestrationService;
    private final ReportingService reportingService;

    public ExecutionController(OrchestrationService orchestrationService, ReportingService reportingService) {
        this.orchestrationService = orchestrationService;
        this.reportingService = reportingService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> trigger(@Valid @RequestBody TriggerExecutionRequest request) {
        String runId = orchestrationService.trigger(request);
        return ResponseEntity.accepted().body(Map.of("runId", runId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExecutionRunResponse> get(@PathVariable String id) {
        return reportingService.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public Page<ExecutionRunResponse> history(@PageableDefault(size = 20) Pageable pageable) {
        return reportingService.history(pageable);
    }
}
