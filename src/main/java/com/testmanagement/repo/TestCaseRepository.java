package com.testmanagement.repo;

import com.testmanagement.domain.TestCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TestCaseRepository extends JpaRepository<TestCase, Long> {

    @Query("SELECT t FROM TestCase t WHERE t.feature.id = :featureId ORDER BY t.sortOrder ASC")
    List<TestCase> findByFeatureIdOrderBySortOrderAsc(@Param("featureId") Long featureId);

    @Query("SELECT COUNT(t) FROM TestCase t WHERE t.feature.id = :featureId")
    long countByFeatureId(@Param("featureId") Long featureId);
}
