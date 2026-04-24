package com.testmanagement.web.dto;

import java.time.Instant;
import java.util.List;

public record FeatureResponse(
        Long id,
        String title,
        String description,
        String status,
        Instant createdAt,
        Instant updatedAt,
        List<TestCaseDto> testCases
) {
}
