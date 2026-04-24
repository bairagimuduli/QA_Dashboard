package com.automationhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = {"com.automationhub", "com.testmanagement"})
@EntityScan(basePackages = {"com.automationhub.domain", "com.testmanagement.domain"})
@EnableJpaRepositories(basePackages = {"com.automationhub.repo", "com.testmanagement.repo"})
@EnableAsync
@EnableScheduling
public class AutomationHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(AutomationHubApplication.class, args);
    }
}
