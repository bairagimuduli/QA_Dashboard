package com.automationhub.reporting;

import com.automationhub.domain.ExecutionRun;
import com.automationhub.domain.Pod;
import com.automationhub.domain.RunStatus;
import com.automationhub.domain.TestSuite;
import com.automationhub.domain.TestType;
import com.automationhub.repo.ExecutionRunRepository;
import com.automationhub.repo.PodRepository;
import com.automationhub.repo.TestSuiteRepository;
import com.automationhub.web.dto.HeatmapCellResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class HeatmapService {

    private final PodRepository podRepository;
    private final TestSuiteRepository testSuiteRepository;
    private final ExecutionRunRepository executionRunRepository;
    private final ObjectMapper objectMapper;

    public HeatmapService(
            PodRepository podRepository,
            TestSuiteRepository testSuiteRepository,
            ExecutionRunRepository executionRunRepository,
            ObjectMapper objectMapper) {
        this.podRepository = podRepository;
        this.testSuiteRepository = testSuiteRepository;
        this.executionRunRepository = executionRunRepository;
        this.objectMapper = objectMapper;
    }

    public List<HeatmapCellResponse> buildHeatmap() {
        List<Pod> pods = podRepository.findAll();
        List<TestSuite> suites = testSuiteRepository.findAll();
        Map<Long, Map<TestType, Long>> suiteIdByPodAndType = new HashMap<>();
        for (TestSuite s : suites) {
            suiteIdByPodAndType
                    .computeIfAbsent(s.getPodId(), k -> new EnumMap<>(TestType.class))
                    .put(s.getType(), s.getId());
        }
        List<HeatmapCellResponse> cells = new ArrayList<>();
        for (Pod pod : pods) {
            Map<TestType, Long> byType = suiteIdByPodAndType.get(pod.getId());
            if (byType == null) {
                continue;
            }
            for (TestType type : TestType.values()) {
                Long suiteId = byType.get(type);
                if (suiteId == null) {
                    continue;
                }
                CellStatus status = latestStatusForSuite(suiteId);
                cells.add(new HeatmapCellResponse(
                        pod.getId(), pod.getName(), type, status.status(), status.runId()));
            }
        }
        return cells;
    }

    private CellStatus latestStatusForSuite(long suiteId) {
        List<ExecutionRun> runs = executionRunRepository.findAll();
        runs.sort(Comparator.comparing(ExecutionRun::getStartTime, Comparator.nullsLast(Comparator.naturalOrder()))
                .reversed());
        for (ExecutionRun r : runs) {
            if (r.getResultSummaryJson() == null) {
                continue;
            }
            ParsedSuite ps = extractSuite(r.getResultSummaryJson(), suiteId);
            if (ps != null) {
                RunStatus st = ps.success() ? RunStatus.PASSED : RunStatus.FAILED;
                return new CellStatus(st, r.getId());
            }
        }
        return new CellStatus(RunStatus.QUEUED, null);
    }

    private ParsedSuite extractSuite(String resultJson, long suiteId) {
        try {
            JsonNode root = objectMapper.readTree(resultJson);
            JsonNode arr = root.get("suiteResults");
            if (arr == null || !arr.isArray()) {
                return null;
            }
            for (JsonNode n : arr) {
                if (n.has("suiteId") && n.get("suiteId").asLong() == suiteId) {
                    boolean ok = n.has("success") && n.get("success").asBoolean();
                    return new ParsedSuite(ok);
                }
            }
        } catch (Exception ignored) {
            return null;
        }
        return null;
    }

    private record ParsedSuite(boolean success) {}

    private record CellStatus(RunStatus status, String runId) {}
}
