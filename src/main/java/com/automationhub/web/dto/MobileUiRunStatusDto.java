package com.automationhub.web.dto;

import java.util.Map;

/**
 * @param phase QUEUED | BUILDING | COMPLETED | UNKNOWN
 */
public record MobileUiRunStatusDto(
        String phase,
        String message,
        String jobFullName,
        Integer buildNumber,
        String buildUrl,
        Boolean building,
        String result,
        Long durationMs,
        Long timestamp,
        String consoleTail,
        Map<String, String> buildParameters) {}
