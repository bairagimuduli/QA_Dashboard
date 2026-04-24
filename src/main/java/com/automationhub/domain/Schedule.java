package com.automationhub.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "schedules")
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_kind", nullable = false)
    private ScheduleTargetKind targetKind;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(name = "cron_expression", nullable = false)
    private String cronExpression;

    @Column(name = "is_active")
    private boolean active = true;

    @Lob
    @Column(name = "parameters_json")
    private String parametersJson;

    public Long getId() {
        return id;
    }

    public ScheduleTargetKind getTargetKind() {
        return targetKind;
    }

    public void setTargetKind(ScheduleTargetKind targetKind) {
        this.targetKind = targetKind;
    }

    public Long getTargetId() {
        return targetId;
    }

    public void setTargetId(Long targetId) {
        this.targetId = targetId;
    }

    public String getCronExpression() {
        return cronExpression;
    }

    public void setCronExpression(String cronExpression) {
        this.cronExpression = cronExpression;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public String getParametersJson() {
        return parametersJson;
    }

    public void setParametersJson(String parametersJson) {
        this.parametersJson = parametersJson;
    }
}
