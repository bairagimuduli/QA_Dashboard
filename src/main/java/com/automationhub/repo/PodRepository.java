package com.automationhub.repo;

import com.automationhub.domain.Pod;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PodRepository extends JpaRepository<Pod, Long> {

    Optional<Pod> findByNameIgnoreCase(String name);
}
