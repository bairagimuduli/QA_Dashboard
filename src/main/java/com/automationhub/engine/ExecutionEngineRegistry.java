package com.automationhub.engine;

import com.automationhub.domain.TestType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class ExecutionEngineRegistry {

    private final Map<TestType, ExecutionEngine> engines = new EnumMap<>(TestType.class);

    public ExecutionEngineRegistry(List<ExecutionEngine> engines) {
        for (ExecutionEngine engine : engines) {
            this.engines.put(engine.type(), engine);
        }
    }

    public ExecutionEngine get(TestType type) {
        ExecutionEngine engine = engines.get(type);
        if (engine == null) {
            throw new IllegalStateException("No engine registered for " + type);
        }
        return engine;
    }
}
