package com.automationhub.engine;

public record EngineRunResult(boolean success, String logLines, String engineReportJson) {}
