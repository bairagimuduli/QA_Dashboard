package com.automationhub.repo;

import com.automationhub.domain.ExecutionRun;
import com.automationhub.domain.RunStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExecutionRunRepository extends JpaRepository<ExecutionRun, String> {

    Page<ExecutionRun> findByStatus(RunStatus status, Pageable pageable);

    Page<ExecutionRun> findAllByOrderByStartTimeDesc(Pageable pageable);

    long countByStatus(RunStatus status);
}
