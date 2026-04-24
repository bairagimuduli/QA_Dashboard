package com.automationhub.engine;

import com.automationhub.domain.TestType;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class WebExecutionEngine extends AbstractStubExecutionEngine {

    @Override
    public TestType type() {
        return TestType.WEB;
    }

    @Override
    protected Duration simulatedDuration() {
        return Duration.ofMillis(500);
    }
}
