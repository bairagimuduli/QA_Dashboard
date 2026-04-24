package com.automationhub.web.dto;

import com.automationhub.domain.TestType;

import java.util.List;

public record TestSuiteResponse(
        Long id,
        String name,
        String description,
        Long podId,
        TestType type,
        String repositoryUrl,
        List<String> tags
) {}
