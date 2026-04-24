package com.automationhub.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "pods")
public class Pod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String owner;

    /** JSON blob: key/value env defaults for this POD */
    @Column(name = "env_vars_json", length = 4000)
    private String envVarsJson;

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    public String getEnvVarsJson() {
        return envVarsJson;
    }

    public void setEnvVarsJson(String envVarsJson) {
        this.envVarsJson = envVarsJson;
    }
}
