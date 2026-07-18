package ai.opspilot.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ai.opspilot.config.AppProperties;
import ai.opspilot.model.Incident;
import ai.opspilot.repo.IncidentRepository;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class SlaOverdueSchedulerTest {
  @Test
  void alertsAdminForStaleUnassignedIncidents() {
    IncidentRepository incidents = mock(IncidentRepository.class);
    ActivityService activity = mock(ActivityService.class);
    CacheService cache = mock(CacheService.class);
    AlertService alerts = mock(AlertService.class);
    AppProperties properties = new AppProperties();
    properties.setUnassignedAlertMinutes(10);

    Incident incident = new Incident();
    incident.setTitle("Unclaimed outage");
    incident.setStatus("Open");
    incident.setOwner("reporter-1");
    when(incidents.findNearSlaCandidates(any(), anyInt(), anyInt())).thenReturn(List.of());
    when(incidents.findSlaOverdueCandidates(any(), anyInt())).thenReturn(List.of());
    when(incidents.findUnassignedAlertCandidates(any(Instant.class), anyInt())).thenReturn(List.of(incident));

    SlaOverdueScheduler scheduler = new SlaOverdueScheduler(incidents, activity, cache, properties, alerts);
    scheduler.flagOverdueIncidents();

    verify(alerts).adminAlert(eq("UNASSIGNED_STALE"), eq(incident), any());
    verify(incidents).saveAll(List.of(incident));
    ArgumentCaptor<Collection<String>> keys = ArgumentCaptor.forClass(Collection.class);
    verify(cache).delete(keys.capture());
    assertThat(keys.getValue()).contains("dashboard:admin", "dashboard:reporter:reporter-1");
    assertThat(keys.getValue()).doesNotContain("dashboard:responder:responder-1");
    verify(cache, never()).deleteByPrefix("dashboard:");
  }

  @Test
  void alertsAssignedResponderWhenSlaIsNear() {
    IncidentRepository incidents = mock(IncidentRepository.class);
    ActivityService activity = mock(ActivityService.class);
    CacheService cache = mock(CacheService.class);
    AlertService alerts = mock(AlertService.class);
    AppProperties properties = new AppProperties();

    Incident incident = new Incident();
    incident.setTitle("Latency spike");
    incident.setStatus("Open");
    incident.setOwner("reporter-1");
    incident.setAssignee("responder-1");
    when(incidents.findNearSlaCandidates(any(), anyInt(), anyInt())).thenReturn(List.of(incident));
    when(incidents.findSlaOverdueCandidates(any(), anyInt())).thenReturn(List.of());
    when(incidents.findUnassignedAlertCandidates(any(), anyInt())).thenReturn(List.of());

    SlaOverdueScheduler scheduler = new SlaOverdueScheduler(incidents, activity, cache, properties, alerts);
    scheduler.flagOverdueIncidents();

    verify(alerts).responderAlert(eq("responder-1"), eq("SLA_NEAR"), eq(incident), any());
    verify(incidents).saveAll(List.of(incident));
    ArgumentCaptor<Collection<String>> keys = ArgumentCaptor.forClass(Collection.class);
    verify(cache).delete(keys.capture());
    assertThat(keys.getValue()).contains("dashboard:admin", "dashboard:reporter:reporter-1", "dashboard:responder:responder-1");
    verify(cache, never()).deleteByPrefix("dashboard:");
  }
}
