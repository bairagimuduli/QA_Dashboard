package com.automationhub.config;

import com.automationhub.domain.ExecutionProfile;
import com.automationhub.domain.Pod;
import com.automationhub.domain.TestSuite;
import com.automationhub.domain.TestType;
import com.automationhub.repo.ExecutionProfileRepository;
import com.automationhub.repo.PodRepository;
import com.automationhub.repo.TestSuiteRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class SampleDataLoader implements ApplicationRunner {

    private final PodRepository podRepository;
    private final TestSuiteRepository testSuiteRepository;
    private final ExecutionProfileRepository executionProfileRepository;

    public SampleDataLoader(
            PodRepository podRepository,
            TestSuiteRepository testSuiteRepository,
            ExecutionProfileRepository executionProfileRepository) {
        this.podRepository = podRepository;
        this.testSuiteRepository = testSuiteRepository;
        this.executionProfileRepository = executionProfileRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (podRepository.count() > 0) {
            return;
        }
        Pod onboarding = pod("Onboarding", "qa-onboarding");
        Pod disbursement = pod("Disbursement", "qa-disbursement");
        Pod payments = pod("Payments", "qa-payments");
        podRepository.saveAll(List.of(onboarding, disbursement, payments));

        onboarding = podRepository.findByNameIgnoreCase("Onboarding").orElseThrow();
        disbursement = podRepository.findByNameIgnoreCase("Disbursement").orElseThrow();
        payments = podRepository.findByNameIgnoreCase("Payments").orElseThrow();

        suite(
                "Onboarding API Smoke",
                onboarding.getId(),
                TestType.API,
                "https://github.com/org/api-tests",
                List.of("smoke", "p0", "pod:onboarding"));
        suite(
                "Onboarding Web Regression",
                onboarding.getId(),
                TestType.WEB,
                "https://github.com/org/web-tests",
                List.of("regression", "pod:onboarding"));
        suite(
                "Disbursement API Smoke",
                disbursement.getId(),
                TestType.API,
                "https://github.com/org/api-tests",
                List.of("smoke", "pod:disbursement"));
        suite(
                "Disbursement Perf",
                disbursement.getId(),
                TestType.PERFORMANCE,
                "https://github.com/org/perf",
                List.of("sanity", "pod:disbursement"));
        suite(
                "Payments Mobile Smoke",
                payments.getId(),
                TestType.MOBILE,
                "https://github.com/org/mobile-tests",
                List.of("smoke", "pod:payments"));

        ExecutionProfile nightly = new ExecutionProfile();
        nightly.setName("Nightly cross-POD smoke");
        nightly.setTargetTags("smoke");
        nightly.setTargetPodIdsJson("[%d,%d,%d]".formatted(onboarding.getId(), disbursement.getId(), payments.getId()));
        nightly.setTargetTypesJson("[\"API\",\"WEB\",\"MOBILE\",\"PERFORMANCE\"]");
        executionProfileRepository.save(nightly);
    }

    private Pod pod(String name, String owner) {
        Pod p = new Pod();
        p.setName(name);
        p.setOwner(owner);
        p.setEnvVarsJson("{\"BASE_URL\":\"https://" + name.toLowerCase() + ".example.com\"}");
        return p;
    }

    private void suite(String name, long podId, TestType type, String repo, List<String> tags) {
        TestSuite s = new TestSuite();
        s.setName(name);
        s.setDescription("Sample catalog entry — replace with your repository metadata.");
        s.setPodId(podId);
        s.setType(type);
        s.setRepositoryUrl(repo);
        s.setTags(tags);
        testSuiteRepository.save(s);
    }
}
