package com.automationhub.web.dto;

import java.util.List;

public record JenkinsParameterFieldDto(
        String name,
        String type,
        List<String> choices,
        String defaultValue) {}
