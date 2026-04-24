package com.automationhub.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
public class SecurityProperties {

    /** When true, all HTTP endpoints are permitted without authentication (local dev only). */
    private boolean devPermitAll = true;

    public boolean isDevPermitAll() {
        return devPermitAll;
    }

    public void setDevPermitAll(boolean devPermitAll) {
        this.devPermitAll = devPermitAll;
    }
}
