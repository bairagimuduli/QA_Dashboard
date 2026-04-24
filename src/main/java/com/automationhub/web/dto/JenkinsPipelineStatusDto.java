package com.automationhub.web.dto;

/**
 * One configured Jenkins job (Jenkinsfile vs JenkinsfileTest) and optional last build info.
 *
 * @param key stable id: {@code jenkinsfile} or {@code jenkinsfileTest}
 * @param title UI label
 * @param jobFullName Jenkins full name with folder slashes
 * @param error null when fetch succeeded or credentials missing message
 * @param lastBuild null when no build yet or error
 */
public record JenkinsPipelineStatusDto(
        String key,
        String title,
        String jobFullName,
        String error,
        JenkinsLastBuildDto lastBuild) {}
