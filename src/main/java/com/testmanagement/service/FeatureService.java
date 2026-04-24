package com.testmanagement.service;

import com.testmanagement.domain.Feature;
import com.testmanagement.domain.FeatureStatus;
import com.testmanagement.domain.TestCase;
import com.testmanagement.repo.FeatureRepository;
import com.testmanagement.repo.TestCaseRepository;
import com.testmanagement.web.dto.CreateFeatureRequest;
import com.testmanagement.web.dto.CreateTestCaseRequest;
import com.testmanagement.web.dto.ExcelImportResponse;
import com.testmanagement.web.dto.FeatureResponse;
import com.testmanagement.web.dto.TestCaseDto;
import com.testmanagement.web.dto.UpdateFeatureRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
public class FeatureService {

    private final FeatureRepository featureRepository;
    private final TestCaseRepository testCaseRepository;
    private final EmailNotificationService emailNotificationService;
    private final TestCaseExcelService testCaseExcelService;

    public FeatureService(
            FeatureRepository featureRepository,
            TestCaseRepository testCaseRepository,
            EmailNotificationService emailNotificationService,
            TestCaseExcelService testCaseExcelService) {
        this.featureRepository = featureRepository;
        this.testCaseRepository = testCaseRepository;
        this.emailNotificationService = emailNotificationService;
        this.testCaseExcelService = testCaseExcelService;
    }

    @Transactional(readOnly = true)
    public List<FeatureResponse> listFeatures() {
        return featureRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public FeatureResponse getFeature(Long id) {
        Feature feature = featureRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Feature not found"));
        return toResponse(feature);
    }

    @Transactional
    public FeatureResponse createFeature(CreateFeatureRequest request) {
        Feature feature = new Feature();
        feature.setTitle(request.title().trim());
        feature.setDescription(request.description());
        feature.setStatus(FeatureStatus.DRAFT);
        featureRepository.save(feature);
        return toResponse(feature);
    }

    @Transactional
    public FeatureResponse updateFeature(Long id, UpdateFeatureRequest request) {
        Feature feature = featureRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Feature not found"));
        assertCanEditMetadata(feature);
        if (StringUtils.hasText(request.title())) {
            feature.setTitle(request.title().trim());
        }
        if (request.description() != null) {
            feature.setDescription(request.description());
        }
        featureRepository.save(feature);
        return toResponse(feature);
    }

    @Transactional
    public FeatureResponse submitForReview(Long id) {
        Feature feature = featureRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Feature not found"));
        if (feature.getStatus() != FeatureStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only features in DRAFT can be submitted for review");
        }
        long count = testCaseRepository.countByFeatureId(id);
        if (count == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add at least one test case before submitting for review");
        }
        feature.setStatus(FeatureStatus.PENDING_PRODUCT_REVIEW);
        featureRepository.save(feature);
        emailNotificationService.notifyProductTeamReviewRequested(feature);
        return toResponse(feature);
    }

    @Transactional
    public FeatureResponse approveForAutomation(Long id) {
        Feature feature = featureRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Feature not found"));
        if (feature.getStatus() != FeatureStatus.PENDING_PRODUCT_REVIEW) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only features pending product review can be approved");
        }
        feature.setStatus(FeatureStatus.APPROVED_FOR_AUTOMATION);
        featureRepository.save(feature);
        emailNotificationService.notifyAutomationTeamApproved(feature);
        return toResponse(feature);
    }

    @Transactional
    public TestCaseDto addTestCase(Long featureId, CreateTestCaseRequest request) {
        Feature feature = featureRepository.findById(featureId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Feature not found"));
        assertCanEditTestCases(feature);
        TestCase tc = new TestCase();
        tc.setFeature(feature);
        tc.setTitle(request.title().trim());
        tc.setSteps(request.steps());
        tc.setExpectedResult(request.expectedResult());
        tc.setPriority(StringUtils.hasText(request.priority()) ? request.priority().trim() : "MEDIUM");
        int order = request.sortOrder() != null
                ? request.sortOrder()
                : (int) testCaseRepository.countByFeatureId(featureId);
        tc.setSortOrder(order);
        testCaseRepository.save(tc);
        return toDto(tc);
    }

    @Transactional
    public ExcelImportResponse importTestCasesFromExcel(Long featureId, MultipartFile file) {
        Feature feature = featureRepository.findById(featureId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Feature not found"));
        assertCanEditTestCases(feature);

        List<TestCaseExcelService.ParsedTestCaseRow> parsed = testCaseExcelService.parse(file);
        int startOrder = (int) testCaseRepository.countByFeatureId(featureId);
        int imported = 0;
        List<String> messages = new ArrayList<>();

        for (int i = 0; i < parsed.size(); i++) {
            TestCaseExcelService.ParsedTestCaseRow row = parsed.get(i);
            try {
                addTestCase(
                        featureId,
                        new CreateTestCaseRequest(
                                row.title(),
                                row.steps(),
                                row.expectedResult(),
                                row.priority(),
                                startOrder + i));
                imported++;
            } catch (ResponseStatusException ex) {
                String reason = ex.getReason() != null ? ex.getReason() : ex.getStatusCode().toString();
                messages.add("Skipped \"" + row.title() + "\": " + reason);
            }
        }

        int skipped = parsed.size() - imported;
        Feature refreshed = featureRepository.findById(featureId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Feature not found"));
        return new ExcelImportResponse(toResponse(refreshed), imported, skipped, messages);
    }

    public byte[] excelTemplateBytes() {
        return testCaseExcelService.buildTemplate();
    }

    @Transactional
    public void deleteTestCase(Long featureId, Long testCaseId) {
        Feature feature = featureRepository.findById(featureId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Feature not found"));
        assertCanEditTestCases(feature);
        TestCase tc = testCaseRepository.findById(testCaseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Test case not found"));
        if (!tc.getFeature().getId().equals(featureId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Test case does not belong to this feature");
        }
        testCaseRepository.delete(tc);
    }

    private void assertCanEditTestCases(Feature feature) {
        if (feature.getStatus() == FeatureStatus.APPROVED_FOR_AUTOMATION) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Test cases cannot be changed after approval for automation");
        }
    }

    private void assertCanEditMetadata(Feature feature) {
        if (feature.getStatus() == FeatureStatus.APPROVED_FOR_AUTOMATION) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Feature cannot be edited after approval for automation");
        }
    }

    private FeatureResponse toResponse(Feature feature) {
        List<TestCaseDto> cases = testCaseRepository.findByFeatureIdOrderBySortOrderAsc(feature.getId()).stream()
                .map(this::toDto)
                .toList();
        return new FeatureResponse(
                feature.getId(),
                feature.getTitle(),
                feature.getDescription(),
                feature.getStatus().name(),
                feature.getCreatedAt(),
                feature.getUpdatedAt(),
                cases
        );
    }

    private TestCaseDto toDto(TestCase tc) {
        return new TestCaseDto(
                tc.getId(),
                tc.getTitle(),
                tc.getSteps(),
                tc.getExpectedResult(),
                tc.getPriority(),
                tc.getSortOrder()
        );
    }
}
