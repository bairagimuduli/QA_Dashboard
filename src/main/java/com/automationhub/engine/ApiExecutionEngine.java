package com.automationhub.engine;

import com.automationhub.domain.TestType;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class ApiExecutionEngine extends AbstractStubExecutionEngine {

    @Override
    public TestType type() {
        return TestType.API;
    }

    @Override
    protected Duration simulatedDuration() {
        return Duration.ofMillis(400);
    }
}
