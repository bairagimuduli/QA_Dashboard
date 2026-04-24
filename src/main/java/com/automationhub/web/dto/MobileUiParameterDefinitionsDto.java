package com.automationhub.web.dto;

import java.util.List;

public record MobileUiParameterDefinitionsDto(
        String pipeline,
        String jobFullName,
        String source,
        List<JenkinsParameterFieldDto> parameters) {}
