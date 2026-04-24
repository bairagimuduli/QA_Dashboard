package com.automationhub.reporting;

import com.automationhub.domain.ExecutionRun;
import com.automationhub.repo.ExecutionRunRepository;
import com.automationhub.web.dto.ExecutionRunResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ReportingService {

    private final ExecutionRunRepository executionRunRepository;

    public ReportingService(ExecutionRunRepository executionRunRepository) {
        this.executionRunRepository = executionRunRepository;
    }

    public Optional<ExecutionRunResponse> findById(String id) {
        return executionRunRepository.findById(id).map(this::toResponse);
    }

    public Page<ExecutionRunResponse> history(Pageable pageable) {
        return executionRunRepository.findAllByOrderByStartTimeDesc(pageable).map(this::toResponse);
    }

    private ExecutionRunResponse toResponse(ExecutionRun run) {
        return new ExecutionRunResponse(
                run.getId(),
                run.getStatus(),
                run.getTriggeredBy(),
                run.getStartTime(),
                run.getEndTime(),
                run.getEnvironment(),
                run.getScope(),
                run.getParametersJson(),
                run.getLogSnippet(),
                run.getResultSummaryJson());
    }
}
