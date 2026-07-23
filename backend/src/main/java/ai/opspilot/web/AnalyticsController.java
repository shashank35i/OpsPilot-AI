package ai.opspilot.web;

import ai.opspilot.repo.IncidentRepository;
import ai.opspilot.repo.TaskRepository;
import ai.opspilot.repo.UserRepository;
import ai.opspilot.service.CacheService;
import ai.opspilot.service.PriorityService;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AnalyticsController {
  private static final List<String> STATUS_BUCKETS = List.of("Open", "Acknowledged", "In Progress", "Investigating", "Mitigated", "Resolved", "Closed");
  private final IncidentRepository incidents;
  private final TaskRepository tasks;
  private final UserRepository users;
  private final PriorityService priority;
  private final CacheService cache;

  public AnalyticsController(IncidentRepository incidents, TaskRepository tasks, UserRepository users, PriorityService priority, CacheService cache) {
    this.incidents = incidents;
    this.tasks = tasks;
    this.users = users;
    this.priority = priority;
    this.cache = cache;
  }

  @GetMapping("/analytics/summary")
  Map<String, Object> summary() {
    var cached = cache.get("analytics:summary", Map.class);
    if (cached.isPresent()) return cached.get();
    long resolvedWithTime = incidents.countResolvedWithResolutionTime();
    long resolvedWithinSla = incidents.countResolvedWithinSla();
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("incidents", statusCounts());
    payload.put("bySeverity", groupMap(incidents.countBySeverityGroup()));
    payload.put("byCategory", groupMap(incidents.countByCategoryGroup()));
    payload.put("volumeTrend", incidents.incidentTrend(Instant.now().minus(Duration.ofDays(14))).stream()
        .map(row -> Map.of("date", String.valueOf(row[0]), "count", ((Number) row[1]).longValue()))
        .toList());
    payload.put("openResolvedTrend", incidents.openResolvedTrend(Instant.now().minus(Duration.ofDays(14))).stream()
        .map(row -> Map.of(
            "date", String.valueOf(row[0]),
            "open", ((Number) row[1]).longValue(),
            "resolved", ((Number) row[2]).longValue()
        ))
        .toList());
    payload.put("averageResolutionTime", formatDuration(incidents.averageResolutionSeconds()));
    payload.put("slaComplianceRate", resolvedWithTime == 0 ? null : Math.round((resolvedWithinSla * 1000.0) / resolvedWithTime) / 10.0);
    payload.put("responderWorkload", incidents.countByAssigneeGroup().stream()
        .map(row -> Map.of(
            "id", String.valueOf(row[0]),
            "name", displayName(String.valueOf(row[0])),
            "count", ((Number) row[1]).longValue()
        ))
        .toList());
    payload.put("topCategories", groupMap(incidents.countByCategoryGroup()));
    payload.put("tasksOpen", tasks.countByStatusNot("Done"));
    cache.set("analytics:summary", payload, Duration.ofSeconds(30));
    return payload;
  }

  @GetMapping("/analytics/cache-metrics")
  Map<String, Object> cacheMetrics() {
    return cache.metrics();
  }

  @GetMapping("/models/priority")
  Map<String, Object> priorityModel() {
    return Map.of("model", priority.model());
  }

  private Map<String, Long> statusCounts() {
    Map<String, Long> counts = new LinkedHashMap<>();
    for (String status : STATUS_BUCKETS) {
      counts.put(status, incidents.countByStatus(status));
    }
    return counts;
  }

  private static Map<String, Long> groupMap(List<Object[]> rows) {
    Map<String, Long> counts = new LinkedHashMap<>();
    for (Object[] row : rows) {
      counts.put(row[0] == null ? "Unspecified" : String.valueOf(row[0]), ((Number) row[1]).longValue());
    }
    return counts;
  }

  private String displayName(String id) {
    if (id == null || id.isBlank()) return "Unassigned";
    return users.findById(id).map(user -> user.getName() == null || user.getName().isBlank() ? user.getEmail() : user.getName()).orElse(id);
  }

  private static String formatDuration(Double seconds) {
    if (seconds == null || seconds <= 0) return "n/a";
    long totalMinutes = Math.round(seconds / 60.0);
    long hours = totalMinutes / 60;
    long minutes = totalMinutes % 60;
    return hours > 0 ? hours + "h " + minutes + "m" : minutes + "m";
  }
}
