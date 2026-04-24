package com.testmanagement.web;

import com.testmanagement.service.FeatureService;
import com.testmanagement.web.dto.CreateFeatureRequest;
import com.testmanagement.web.dto.CreateTestCaseRequest;
import com.testmanagement.web.dto.FeatureResponse;
import com.testmanagement.web.dto.TestCaseDto;
import com.testmanagement.web.dto.ExcelImportResponse;
import com.testmanagement.web.dto.UpdateFeatureRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/features")
public class FeatureController {

    private final FeatureService featureService;

    public FeatureController(FeatureService featureService) {
        this.featureService = featureService;
    }

    @GetMapping
    public List<FeatureResponse> list() {
        return featureService.listFeatures();
    }

    @GetMapping("/test-case-excel-template")
    public ResponseEntity<byte[]> downloadExcelTemplate() {
        byte[] bytes = featureService.excelTemplateBytes();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"test-cases-template.xlsx\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @GetMapping("/{id}")
    public FeatureResponse get(@PathVariable Long id) {
        return featureService.getFeature(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FeatureResponse create(@Valid @RequestBody CreateFeatureRequest request) {
        return featureService.createFeature(request);
    }

    @PutMapping("/{id}")
    public FeatureResponse update(@PathVariable Long id, @RequestBody UpdateFeatureRequest request) {
        return featureService.updateFeature(id, request);
    }

    @PostMapping("/{id}/submit-for-review")
    public FeatureResponse submitForReview(@PathVariable Long id) {
        return featureService.submitForReview(id);
    }

    @PostMapping("/{id}/approve-for-automation")
    public FeatureResponse approveForAutomation(@PathVariable Long id) {
        return featureService.approveForAutomation(id);
    }

    @PostMapping("/{id}/test-cases")
    @ResponseStatus(HttpStatus.CREATED)
    public TestCaseDto addTestCase(@PathVariable Long id, @Valid @RequestBody CreateTestCaseRequest request) {
        return featureService.addTestCase(id, request);
    }

    @PostMapping("/{id}/test-cases/import-excel")
    public ExcelImportResponse importTestCasesExcel(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return featureService.importTestCasesFromExcel(id, file);
    }

    @DeleteMapping("/{featureId}/test-cases/{testCaseId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTestCase(@PathVariable Long featureId, @PathVariable Long testCaseId) {
        featureService.deleteTestCase(featureId, testCaseId);
    }
}
