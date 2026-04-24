package com.testmanagement.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateFeatureRequest(
        @NotBlank String title,
        String description
) {
}
