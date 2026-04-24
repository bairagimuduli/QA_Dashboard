package com.automationhub.web;

import com.automationhub.domain.RunStatus;
import com.automationhub.reporting.HeatmapService;
import com.automationhub.repo.ExecutionRunRepository;
import com.automationhub.web.dto.DashboardSummaryResponse;
import com.automationhub.web.dto.HeatmapCellResponse;
import com.testmanagement.domain.FeatureStatus;
import com.testmanagement.repo.FeatureRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final ExecutionRunRepository executionRunRepository;
    private final FeatureRepository featureRepository;
    private final HeatmapService heatmapService;

    public DashboardController(
            ExecutionRunRepository executionRunRepository,
            FeatureRepository featureRepository,
            HeatmapService heatmapService) {
        this.executionRunRepository = executionRunRepository;
        this.featureRepository = featureRepository;
        this.heatmapService = heatmapService;
    }

    @GetMapping("/summary")
    public DashboardSummaryResponse summary() {
        long passed = executionRunRepository.countByStatus(RunStatus.PASSED);
        long failed = executionRunRepository.countByStatus(RunStatus.FAILED);
        long running = executionRunRepository.countByStatus(RunStatus.RUNNING);
        long queued = executionRunRepository.countByStatus(RunStatus.QUEUED);
        long totalRuns = executionRunRepository.count();

        List<HeatmapCellResponse> cells = heatmapService.buildHeatmap();
        long hp = cells.stream().filter(c -> c.lastRunStatus() == RunStatus.PASSED).count();
        long hf = cells.stream().filter(c -> c.lastRunStatus() == RunStatus.FAILED).count();
        long hq = cells.stream().filter(c -> c.lastRunStatus() == RunStatus.QUEUED).count();

        long draft = featureRepository.countByStatus(FeatureStatus.DRAFT);
        long pend = featureRepository.countByStatus(FeatureStatus.PENDING_PRODUCT_REVIEW);
        long appr = featureRepository.countByStatus(FeatureStatus.APPROVED_FOR_AUTOMATION);

        return new DashboardSummaryResponse(
                new DashboardSummaryResponse.RunSummary(passed, failed, running, queued, totalRuns),
                new DashboardSummaryResponse.HeatmapSummary(cells.size(), hp, hf, hq),
                new DashboardSummaryResponse.FeaturePipelineSummary(draft, pend, appr, draft + pend + appr));
    }
}
