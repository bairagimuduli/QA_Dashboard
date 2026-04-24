package com.testmanagement.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.notifications")
public class NotificationProperties {

    private boolean enabled = true;
    private String fromAddress = "noreply@yourcompany.com";
    private String productTeamEmails = "";
    private String automationTeamEmails = "";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getFromAddress() {
        return fromAddress;
    }

    public void setFromAddress(String fromAddress) {
        this.fromAddress = fromAddress;
    }

    public String getProductTeamEmails() {
        return productTeamEmails;
    }

    public void setProductTeamEmails(String productTeamEmails) {
        this.productTeamEmails = productTeamEmails;
    }

    public String getAutomationTeamEmails() {
        return automationTeamEmails;
    }

    public void setAutomationTeamEmails(String automationTeamEmails) {
        this.automationTeamEmails = automationTeamEmails;
    }
}
