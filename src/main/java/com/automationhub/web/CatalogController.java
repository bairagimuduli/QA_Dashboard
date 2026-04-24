package com.automationhub.web;

import com.automationhub.domain.ExecutionProfile;
import com.automationhub.domain.Pod;
import com.automationhub.domain.TestSuite;
import com.automationhub.repo.ExecutionProfileRepository;
import com.automationhub.repo.PodRepository;
import com.automationhub.repo.TestSuiteRepository;
import com.automationhub.web.dto.PodResponse;
import com.automationhub.web.dto.TestSuiteResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/catalog")
public class CatalogController {

    private final PodRepository podRepository;
    private final TestSuiteRepository testSuiteRepository;
    private final ExecutionProfileRepository executionProfileRepository;

    public CatalogController(
            PodRepository podRepository,
            TestSuiteRepository testSuiteRepository,
            ExecutionProfileRepository executionProfileRepository) {
        this.podRepository = podRepository;
        this.testSuiteRepository = testSuiteRepository;
        this.executionProfileRepository = executionProfileRepository;
    }

    @GetMapping("/pods")
    public List<PodResponse> pods() {
        return podRepository.findAll().stream()
                .map(p -> new PodResponse(p.getId(), p.getName(), p.getOwner()))
                .toList();
    }

    @GetMapping("/suites")
    public List<TestSuiteResponse> suites() {
        return testSuiteRepository.findAll().stream()
                .map(s -> new TestSuiteResponse(
                        s.getId(),
                        s.getName(),
                        s.getDescription(),
                        s.getPodId(),
                        s.getType(),
                        s.getRepositoryUrl(),
                        s.getTags()))
                .toList();
    }

    @GetMapping("/profiles")
    public List<ExecutionProfile> profiles() {
        return executionProfileRepository.findAll();
    }
}
