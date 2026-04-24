package com.automationhub.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.util.Map;

public record MobileUiTriggerRequest(
        @NotBlank
                @Pattern(regexp = "jenkinsfile|jenkinsfileTest")
                String pipeline,
        Map<String, String> parameters) {}
