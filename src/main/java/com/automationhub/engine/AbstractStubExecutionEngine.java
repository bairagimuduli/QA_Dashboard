package com.automationhub.engine;

import com.automationhub.domain.TestSuite;
import com.automationhub.domain.TestType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;

/**
 * Simulates Gradle/Jenkins/remote runner. Replace with ProcessBuilder or HTTP client to real workers.
 */
abstract class AbstractStubExecutionEngine implements ExecutionEngine {

    private final Logger log = LoggerFactory.getLogger(getClass());

    protected abstract Duration simulatedDuration();

    @Override
    public EngineRunResult execute(TestSuite suite, ExecutionContext context) {
        log.info("[{}] Stub execute suite={} run={} env={}", type(), suite.getName(), context.runId(), context.environment());
        try {
            Thread.sleep(simulatedDuration());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new EngineRunResult(false, "Interrupted", "{\"ok\":false}");
        }
        String json =
                "{\"suiteId\":%d,\"type\":\"%s\",\"ok\":true}".formatted(suite.getId(), type().name());
        return new EngineRunResult(
                true,
                "[%s] Finished stub run for %s (%s)"
                        .formatted(context.runId(), suite.getName(), type()),
                json);
    }
}
