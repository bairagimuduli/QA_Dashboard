package com.testmanagement.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateTestCaseRequest(
        @NotBlank String title,
        String steps,
        String expectedResult,
        String priority,
        Integer sortOrder
) {
}
