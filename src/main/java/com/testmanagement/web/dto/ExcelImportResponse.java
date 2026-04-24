package com.testmanagement.web.dto;

import java.util.List;

public record ExcelImportResponse(
        FeatureResponse feature,
        int imported,
        int skipped,
        List<String> messages
) {
}
