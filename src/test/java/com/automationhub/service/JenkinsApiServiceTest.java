package com.automationhub.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class JenkinsApiServiceTest {

    @Test
    void jobFullNameToPath_buildsJenkinsRestPath() {
        assertEquals(
                "/job/QA_related/job/UI_Automation/job/MobileUI_Automation_NEO/",
                JenkinsApiService.jobFullNameToPath("QA_related/UI_Automation/MobileUI_Automation_NEO"));
    }
}
