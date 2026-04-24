package com.testmanagement.repo;

import com.testmanagement.domain.Feature;
import com.testmanagement.domain.FeatureStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeatureRepository extends JpaRepository<Feature, Long> {

    long countByStatus(FeatureStatus status);
}
