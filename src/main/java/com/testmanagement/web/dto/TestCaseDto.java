package com.testmanagement.web.dto;

public record TestCaseDto(
        Long id,
        String title,
        String steps,
        String expectedResult,
        String priority,
        int sortOrder
) {
}
