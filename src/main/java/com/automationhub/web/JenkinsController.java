package com.automationhub.web;

import com.automationhub.service.JenkinsApiService;
import com.automationhub.web.dto.MobileUiJenkinsSummaryDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/jenkins")
public class JenkinsController {

    private final JenkinsApiService jenkinsApiService;

    public JenkinsController(JenkinsApiService jenkinsApiService) {
        this.jenkinsApiService = jenkinsApiService;
    }

    /** Mobile UI: Jenkinsfile + JenkinsfileTest job last-build status. */
    @GetMapping("/mobile-ui/summary")
    public MobileUiJenkinsSummaryDto mobileUiSummary() {
        return jenkinsApiService.mobileUiSummary();
    }
}
