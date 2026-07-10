package ai.opspilot.service;

import ai.opspilot.config.AppProperties;
import ai.opspilot.model.Incident;
import ai.opspilot.repo.IncidentRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SlaOverdueScheduler {
  private static final List<String> INCIDENT_CACHE_KEYS = List.of(
      "incidents:all",
      "incidents:Open",
      "incidents:Investigating",
      "incidents:Mitigated",
      "incidents:Resolved",
      "analytics:summary",
      "activities:latest"
  );

  private final IncidentRepository incidents;
  private final ActivityService activity;
  private final CacheService cache;
  private final AppProperties properties;

  public SlaOverdueScheduler(
      IncidentRepository incidents,
      ActivityService activity,
      CacheService cache,
      AppProperties properties
  ) {
    this.incidents = incidents;
    this.activity = activity;
    this.cache = cache;
    this.properties = properties;
  }

  @Scheduled(fixedDelayString = "${opspilot.sla-overdue-scheduler-delay-ms:60000}")
  @Transactional
  public void flagOverdueIncidents() {
    if (!properties.isSlaOverdueSchedulerEnabled()) return;

    Instant now = Instant.now();
    int limit = Math.max(1, properties.getSlaOverdueBatchSize());
    List<Incident> overdue = incidents.findSlaOverdueCandidates(now, limit);
    if (overdue.isEmpty()) return;

    List<Incident> changed = new ArrayList<>(overdue.size());
    for (Incident incident : overdue) {
      incident.setSlaOverdue(true);
      incident.setSlaOverdueAt(now);
      changed.add(incident);
      activity.log(
          null,
          "SLA_OVERDUE",
          "Incident",
          incident.getId(),
          "SLA overdue: " + incident.getTitle(),
          Map.of("dueAt", String.valueOf(incident.getDueAt()), "status", incident.getStatus())
      );
    }
    incidents.saveAll(changed);
    cache.delete(INCIDENT_CACHE_KEYS);
  }
}
