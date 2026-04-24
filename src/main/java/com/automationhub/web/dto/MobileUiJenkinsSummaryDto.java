package com.automationhub.web.dto;

import java.util.List;

public record MobileUiJenkinsSummaryDto(
        String jenkinsBaseUrl,
        boolean credentialsConfigured,
        List<JenkinsPipelineStatusDto> pipelines) {}
