package com.automationhub.repo;

import com.automationhub.domain.ExecutionProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ExecutionProfileRepository extends JpaRepository<ExecutionProfile, Long> {

    Optional<ExecutionProfile> findByName(String name);
}
