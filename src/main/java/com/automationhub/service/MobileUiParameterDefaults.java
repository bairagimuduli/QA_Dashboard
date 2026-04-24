package com.automationhub.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Fallback choices when Jenkins job API does not expose parameter definitions (or parse fails).
 * Align with Mobile UI Jenkinsfile / JenkinsfileTest job parameters.
 */
public final class MobileUiParameterDefaults {

    private MobileUiParameterDefaults() {}

    public static final List<String> ENV = List.of("PROD", "STAGE", "BETA");

    public static final List<String> SUITE =
            List.of("prod_run", "regression", "product_live_data", "onboarding", "repayment", "disbursement", "prime_loan", "sanity");

    public static final List<String> APP_BUILD = List.of(
            "Mar(4.3.4+100394)",
            "Feb(4.3.3+100393)",
            "Feb(4.3.2+100392)",
            "Jan(4.3.1+100391)");

    /** Placeholder labels — replace with real distribution lists from Jenkins if different. */
    public static final List<String> MAIL_RECIPIENT_EMAIL = List.of("TAT_TEAM", "ALL", "QA");

    public static final List<String> BRANCH_NAME = List.of("functional_code", "master");

    public static Map<String, List<String>> asChoiceMap(boolean includeBranch) {
        Map<String, List<String>> m = new LinkedHashMap<>();
        m.put("ENV", ENV);
        m.put("SUITE", SUITE);
        m.put("APP_BUILD", APP_BUILD);
        m.put("MAIL_RECIPIENT_EMAIL", MAIL_RECIPIENT_EMAIL);
        if (includeBranch) {
            m.put("BRANCH_NAME", BRANCH_NAME);
        }
        return m;
    }
}
