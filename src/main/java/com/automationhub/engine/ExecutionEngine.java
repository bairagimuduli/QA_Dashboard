package com.automationhub.engine;

import com.automationhub.domain.TestSuite;
import com.automationhub.domain.TestType;

public interface ExecutionEngine {

    TestType type();

    EngineRunResult execute(TestSuite suite, ExecutionContext context);
}
