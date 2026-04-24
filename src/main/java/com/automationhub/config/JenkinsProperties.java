package com.automationhub.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jenkins")
public class JenkinsProperties {

    /**
     * Jenkins controller root, e.g. https://qa-jenkins.mpokket.org (no trailing slash).
     */
    private String baseUrl = "https://qa-jenkins.mpokket.org";

    /** API user (Jenkins user id). */
    private String username = "";

    /** Jenkins API token (not password). */
    private String apiToken = "";

    private final MobileUi mobileUi = new MobileUi();

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getApiToken() {
        return apiToken;
    }

    public void setApiToken(String apiToken) {
        this.apiToken = apiToken;
    }

    public MobileUi getMobileUi() {
        return mobileUi;
    }

    public static class MobileUi {

        /**
         * Full job name for the primary pipeline (repo Jenkinsfile). Folders use {@code /}, e.g.
         * {@code QA_related/UI_Automation/MobileUI_Automation_NEO}.
         */
        private String pipelineJenkinsfile = "QA_related/UI_Automation/MobileUI_Automation_NEO";

        /**
         * Full job name for JenkinsfileTest (manual / wider suite list). Override if your controller
         * uses a different name.
         */
        private String pipelineJenkinsfileTest = "QA_related/UI_Automation/MobileUI_Automation_NEO_Test";

        public String getPipelineJenkinsfile() {
            return pipelineJenkinsfile;
        }

        public void setPipelineJenkinsfile(String pipelineJenkinsfile) {
            this.pipelineJenkinsfile = pipelineJenkinsfile;
        }

        public String getPipelineJenkinsfileTest() {
            return pipelineJenkinsfileTest;
        }

        public void setPipelineJenkinsfileTest(String pipelineJenkinsfileTest) {
            this.pipelineJenkinsfileTest = pipelineJenkinsfileTest;
        }
    }
}
