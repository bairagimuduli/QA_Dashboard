package com.automationhub.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.orchestration")
public class OrchestrationProperties {

    /** Root folder where worker clones or finds test repositories */
    private String workspaceRoot = "./workspaces";

    public String getWorkspaceRoot() {
        return workspaceRoot;
    }

    public void setWorkspaceRoot(String workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }
}
