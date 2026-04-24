package com.automationhub.repo;

import com.automationhub.domain.TestSuite;
import com.automationhub.domain.TestType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestSuiteRepository extends JpaRepository<TestSuite, Long> {

    List<TestSuite> findByPodIdInAndTypeIn(List<Long> podIds, List<TestType> types);
}
