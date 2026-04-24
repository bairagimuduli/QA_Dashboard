package com.automationhub.scheduler;

import com.automationhub.repo.ScheduleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Placeholder for CRON / distributed queue integration (Quartz, RabbitMQ, AWS EventBridge).
 * Wire {@link com.automationhub.domain.Schedule} entities to {@code OrchestrationService.trigger} here.
 */
@Service
public class JobSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(JobSchedulerService.class);

    private final ScheduleRepository scheduleRepository;

    public JobSchedulerService(ScheduleRepository scheduleRepository) {
        this.scheduleRepository = scheduleRepository;
    }

    @Scheduled(fixedDelay = 600_000)
    public void pollSchedulesPlaceholder() {
        long n = scheduleRepository.findByActiveIsTrue().size();
        if (n > 0) {
            log.debug("{} active schedule(s) registered — connect dispatcher to orchestration.", n);
        }
    }
}
