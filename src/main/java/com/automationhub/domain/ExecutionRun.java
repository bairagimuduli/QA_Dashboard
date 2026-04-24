package com.automationhub.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "execution_runs")
public class ExecutionRun {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "profile_id")
    private Long profileId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RunStatus status;

    @Column(name = "triggered_by")
    private String triggeredBy;

    @Column(name = "start_time")
    private Instant startTime;

    @Column(name = "end_time")
    private Instant endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "environment")
    private DeploymentEnvironment environment;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope")
    private TestScope scope;

    @Lob
    @Column(name = "parameters_json")
    private String parametersJson;

    @Lob
    @Column(name = "log_snippet")
    private String logSnippet;

    @Lob
    @Column(name = "result_summary_json")
    private String resultSummaryJson;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Long getProfileId() {
        return profileId;
    }

    public void setProfileId(Long profileId) {
        this.profileId = profileId;
    }

    public RunStatus getStatus() {
        return status;
    }

    public void setStatus(RunStatus status) {
        this.status = status;
    }

    public String getTriggeredBy() {
        return triggeredBy;
    }

    public void setTriggeredBy(String triggeredBy) {
        this.triggeredBy = triggeredBy;
    }

    public Instant getStartTime() {
        return startTime;
    }

    public void setStartTime(Instant startTime) {
        this.startTime = startTime;
    }

    public Instant getEndTime() {
        return endTime;
    }

    public void setEndTime(Instant endTime) {
        this.endTime = endTime;
    }

    public DeploymentEnvironment getEnvironment() {
        return environment;
    }

    public void setEnvironment(DeploymentEnvironment environment) {
        this.environment = environment;
    }

    public TestScope getScope() {
        return scope;
    }

    public void setScope(TestScope scope) {
        this.scope = scope;
    }

    public String getParametersJson() {
        return parametersJson;
    }

    public void setParametersJson(String parametersJson) {
        this.parametersJson = parametersJson;
    }

    public String getLogSnippet() {
        return logSnippet;
    }

    public void setLogSnippet(String logSnippet) {
        this.logSnippet = logSnippet;
    }

    public String getResultSummaryJson() {
        return resultSummaryJson;
    }

    public void setResultSummaryJson(String resultSummaryJson) {
        this.resultSummaryJson = resultSummaryJson;
    }
}
