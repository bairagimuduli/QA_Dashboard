package com.automationhub.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

@Entity
@Table(name = "execution_profiles")
public class ExecutionProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    /** Comma-separated or JSON array of tag names */
    @Column(name = "target_tags", length = 2000)
    private String targetTags;

    /** JSON array of POD ids, e.g. [1,2] */
    @Lob
    @Column(name = "target_pod_ids")
    private String targetPodIdsJson;

    /** JSON array of TestType names */
    @Lob
    @Column(name = "target_types")
    private String targetTypesJson;

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTargetTags() {
        return targetTags;
    }

    public void setTargetTags(String targetTags) {
        this.targetTags = targetTags;
    }

    public String getTargetPodIdsJson() {
        return targetPodIdsJson;
    }

    public void setTargetPodIdsJson(String targetPodIdsJson) {
        this.targetPodIdsJson = targetPodIdsJson;
    }

    public String getTargetTypesJson() {
        return targetTypesJson;
    }

    public void setTargetTypesJson(String targetTypesJson) {
        this.targetTypesJson = targetTypesJson;
    }
}
