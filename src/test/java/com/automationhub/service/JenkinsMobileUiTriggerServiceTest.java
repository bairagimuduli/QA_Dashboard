package com.automationhub.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class JenkinsMobileUiTriggerServiceTest {

    @Test
    void extractJobFullNameFromBuildUrl_parsesFolderJob() {
        assertEquals(
                "QA_related/UI_Automation/MobileUI_Automation_NEO",
                JenkinsMobileUiTriggerService.extractJobFullNameFromBuildUrl(
                        "{{url}}/job/QA_related/job/UI_Automation/job/MobileUI_Automation_NEO/42/"));
    }
}
