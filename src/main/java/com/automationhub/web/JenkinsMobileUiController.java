package com.automationhub.web;

import com.automationhub.service.JenkinsMobileUiTriggerService;
import com.automationhub.web.dto.MobileUiParameterDefinitionsDto;
import com.automationhub.web.dto.MobileUiRunStatusDto;
import com.automationhub.web.dto.MobileUiTriggerRequest;
import com.automationhub.web.dto.MobileUiTriggerResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/api/jenkins/mobile-ui")
public class JenkinsMobileUiController {

    private final JenkinsMobileUiTriggerService triggerService;

    public JenkinsMobileUiController(JenkinsMobileUiTriggerService triggerService) {
        this.triggerService = triggerService;
    }

    /** Choice lists / defaults from Jenkins job API, or static fallback. */
    @GetMapping("/parameter-definitions")
    public MobileUiParameterDefinitionsDto parameterDefinitions(
            @RequestParam(defaultValue = "jenkinsfile") String pipeline) {
        if (!pipeline.equals("jenkinsfile") && !pipeline.equals("jenkinsfileTest")) {
            throw new ResponseStatusException(BAD_REQUEST, "pipeline must be jenkinsfile or jenkinsfileTest");
        }
        return triggerService.loadParameterDefinitions(pipeline);
    }

    /** Queues a parameterized build (same as Build with Parameters in Jenkins UI). */
    @PostMapping("/trigger")
    public MobileUiTriggerResponse trigger(@Valid @RequestBody MobileUiTriggerRequest body) {
        Map<String, String> params = body.parameters() != null ? body.parameters() : Map.of();
        return triggerService.trigger(body.pipeline(), params);
    }

    /**
     * Poll run state: either {@code queueItemId} (until build starts) or {@code jobFullName} + {@code buildNumber}
     * (until finished — use this after you have a build number so polling survives queue expiry).
     */
    @GetMapping("/run-status")
    public MobileUiRunStatusDto runStatus(
            @RequestParam(required = false) Long queueItemId,
            @RequestParam(required = false) String jobFullName,
            @RequestParam(required = false) Integer buildNumber) {
        if (queueItemId != null) {
            return triggerService.statusByQueueItem(queueItemId);
        }
        if (jobFullName != null && !jobFullName.isBlank() && buildNumber != null) {
            return triggerService.statusByJobAndBuild(jobFullName, buildNumber);
        }
        throw new ResponseStatusException(BAD_REQUEST, "Provide queueItemId or jobFullName + buildNumber");
    }
}
