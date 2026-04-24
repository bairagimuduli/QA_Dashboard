package com.automationhub.web.dto;

import java.util.LinkedHashMap;
import java.util.Map;

/** Minimal last-build view for QA Dashboard (Mobile UI Jenkins pipelines). */
public record JenkinsLastBuildDto(
        int number,
        String result,
        boolean building,
        long timestamp,
        long durationMs,
        String url,
        Map<String, String> parameters) {

    public static JenkinsLastBuildDto of(
            int number,
            String result,
            boolean building,
            long timestamp,
            long durationMs,
            String url,
            Map<String, String> parameters) {
        return new JenkinsLastBuildDto(
                number,
                result != null ? result : "",
                building,
                timestamp,
                durationMs,
                url != null ? url : "",
                parameters != null ? new LinkedHashMap<>(parameters) : Map.of());
    }
}
