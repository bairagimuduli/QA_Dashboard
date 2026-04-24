package com.automationhub.reporting;

import com.automationhub.domain.RunStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class RunEventPublisher {

    private final SimpMessagingTemplate messaging;

    public RunEventPublisher(SimpMessagingTemplate messaging) {
        this.messaging = messaging;
    }

    public void publishStatus(String runId, RunStatus status, String message) {
        messaging.convertAndSend(
                "/topic/runs/" + runId, Map.of("status", status.name(), "message", message == null ? "" : message));
    }
}
