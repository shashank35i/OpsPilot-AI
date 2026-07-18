package ai.opspilot.service;

import ai.opspilot.config.AppProperties;
import ai.opspilot.model.Incident;
import ai.opspilot.repo.IncidentRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SlaOverdueScheduler {
  private static final List<String> SUMMARY_CACHE_KEYS = List.of("analytics:summary", "activities:latest");

  private final IncidentRepository incidents;
  private final ActivityService activity;
  private final CacheService cache;
  private final AppProperties properties;
  private final AlertService alerts;

  public SlaOverdueScheduler(
      IncidentRepository incidents,
      ActivityService activity,
      CacheService cache,
      AppProperties properties,
      AlertService alerts
  ) {
    this.incidents = incidents;
    this.activity = activity;
    this.cache = cache;
    this.properties = properties;
    this.alerts = alerts;
  }

  @Scheduled(fixedDelayString = "${opspilot.sla-overdue-scheduler-delay-ms:60000}")
  @Transactional
  public void flagOverdueIncidents() {
    if (!properties.isSlaOverdueSchedulerEnabled()) return;

    Instant now = Instant.now();
    int limit = Math.max(1, properties.getSlaOverdueBatchSize());
    flagNearSla(now, limit);
    flagUnassigned(now, limit);

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
      if (incident.getAssignee() == null || incident.getAssignee().isBlank()) {
        alerts.adminAlert("SLA_BREACHED", incident, "SLA breached for unassigned incident: " + incident.getTitle());
      } else {
        alerts.responderAlert(incident.getAssignee(), "SLA_BREACHED", incident, "SLA breached: " + incident.getTitle());
      }
    }
    incidents.saveAll(changed);
    invalidateDashboardCaches(changed);
  }

  private void flagNearSla(Instant now, int limit) {
    int threshold = Math.max(1, Math.min(99, properties.getSlaNearThresholdPercent()));
    List<Incident> nearSla = incidents.findNearSlaCandidates(now, threshold, limit);
    if (nearSla.isEmpty()) return;
    for (Incident incident : nearSla) {
      incident.setSlaNearAlerted(true);
      if (incident.getAssignee() == null || incident.getAssignee().isBlank()) {
        alerts.adminAlert("SLA_NEAR", incident, "Incident is nearing SLA and is unassigned: " + incident.getTitle());
      } else {
        alerts.responderAlert(incident.getAssignee(), "SLA_NEAR", incident, "Incident is nearing SLA: " + incident.getTitle());
      }
    }
    incidents.saveAll(nearSla);
    invalidateDashboardCaches(nearSla);
  }

  private void flagUnassigned(Instant now, int limit) {
    Instant cutoff = now.minusSeconds(Math.max(1, properties.getUnassignedAlertMinutes()) * 60L);
    List<Incident> unassigned = incidents.findUnassignedAlertCandidates(cutoff, limit);
    if (unassigned.isEmpty()) return;
    for (Incident incident : unassigned) {
      incident.setUnassignedAlerted(true);
      alerts.adminAlert("UNASSIGNED_STALE", incident, "Incident has remained unassigned: " + incident.getTitle());
    }
    incidents.saveAll(unassigned);
    invalidateDashboardCaches(unassigned);
  }

  private void invalidateDashboardCaches(List<Incident> changed) {
    if (changed == null || changed.isEmpty()) return;
    Set<String> keys = new LinkedHashSet<>(SUMMARY_CACHE_KEYS);
    keys.add("dashboard:admin");
    for (Incident incident : changed) {
      if (incident.getOwner() != null && !incident.getOwner().isBlank()) {
        keys.add("dashboard:reporter:" + incident.getOwner());
      }
      if (incident.getAssignee() != null && !incident.getAssignee().isBlank()) {
        keys.add("dashboard:responder:" + incident.getAssignee());
      }
    }
    cache.delete(keys);
  }
}
