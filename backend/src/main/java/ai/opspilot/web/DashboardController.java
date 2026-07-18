package ai.opspilot.web;

import ai.opspilot.model.Activity;
import ai.opspilot.model.Incident;
import ai.opspilot.model.User;
import ai.opspilot.repo.ActivityRepository;
import ai.opspilot.repo.IncidentRepository;
import ai.opspilot.repo.UserRepository;
import ai.opspilot.security.UserPrincipal;
import ai.opspilot.service.CacheService;
import ai.opspilot.service.PriorityService;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
  private static final List<String> CLOSED_STATUSES = List.of("Resolved", "Closed");
  private static final List<String> STATUS_BUCKETS = List.of("Open", "Acknowledged", "In Progress", "Investigating", "Mitigated", "Resolved", "Closed");

  private final IncidentRepository incidents;
  private final ActivityRepository activities;
  private final UserRepository users;
  private final PriorityService priority;
  private final CacheService cache;

  public DashboardController(
      IncidentRepository incidents,
      ActivityRepository activities,
      UserRepository users,
      PriorityService priority,
      CacheService cache
  ) {
    this.incidents = incidents;
    this.activities = activities;
    this.users = users;
    this.priority = priority;
    this.cache = cache;
  }

  @GetMapping
  Map<String, Object> dashboard(@AuthenticationPrincipal UserPrincipal user) {
    String cacheKey = dashboardCacheKey(user);
    var cached = cache.get(cacheKey, Map.class);
    if (cached.isPresent()) return cached.get();

    Map<String, Object> payload = switch (user.role()) {
      case "Admin" -> adminDashboard();
      case "Responder" -> responderDashboard(user.id());
      default -> reporterDashboard(user.id());
    };
    cache.set(cacheKey, payload, Duration.ofSeconds(30));
    return payload;
  }

  private static String dashboardCacheKey(UserPrincipal user) {
    return switch (user.role()) {
      case "Admin" -> "dashboard:admin";
      case "Responder" -> "dashboard:responder:" + user.id();
      default -> "dashboard:reporter:" + user.id();
    };
  }

  private Map<String, Object> reporterDashboard(String reporterId) {
    PageRequest page = PageRequest.of(0, 50);
    List<Incident> mine = incidents.findByOwnerOrderByCreatedAtDesc(reporterId, page);
    List<String> ids = mine.stream().map(Incident::getId).toList();

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("role", "Reporter");
    payload.put("summary", Map.of(
        "total", incidents.countByOwner(reporterId),
        "open", incidents.countByOwnerAndStatus(reporterId, "Open"),
        "inProgress", incidents.countByOwnerAndStatus(reporterId, "In Progress")
            + incidents.countByOwnerAndStatus(reporterId, "Investigating")
            + incidents.countByOwnerAndStatus(reporterId, "Acknowledged"),
        "resolved", incidents.countByOwnerAndStatus(reporterId, "Resolved"),
        "closed", incidents.countByOwnerAndStatus(reporterId, "Closed")
    ));
    payload.put("bySeverity", groupMap(incidents.countBySeverityForOwner(reporterId)));
    payload.put("byCategory", groupMap(incidents.countByCategoryForOwner(reporterId)));
    payload.put("incidents", mine.stream().map(this::incidentCard).toList());
    payload.put("latestUpdates", ids.isEmpty()
        ? List.of()
        : activities.findByEntityTypeAndEntityIdInOrderByCreatedAtDesc("Incident", ids, PageRequest.of(0, 10)));
    payload.put("notifications", ids.isEmpty()
        ? List.of()
        : activities.findByEntityTypeAndEntityIdInOrderByCreatedAtDesc("Incident", ids, PageRequest.of(0, 8)));
    return payload;
  }

  private Map<String, Object> responderDashboard(String responderId) {
    Instant now = Instant.now();
    List<Incident> assigned = incidents.findByAssigneeOrderByCreatedAtDesc(responderId, PageRequest.of(0, 50));
    List<Incident> unassigned = incidents.findByAssigneeIsNullAndStatusNotOrderByCreatedAtAsc("Resolved", PageRequest.of(0, 25))
        .stream()
        .filter(incident -> !"Closed".equals(incident.getStatus()))
        .toList();
    List<Incident> review = incidents.findBySeverityReviewStatusOrderByCreatedAtDesc("NeedsReview", PageRequest.of(0, 25));
    List<Incident> nearSla = incidents.findAssigneeNearSla(responderId, now, 80, 25);
    List<Incident> breached = incidents.findAssigneeSlaBreached(responderId, now, 25);

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("role", "Responder");
    payload.put("summary", Map.of(
        "assigned", incidents.countByAssignee(responderId),
        "open", incidents.countByAssigneeAndStatus(responderId, "Open")
            + incidents.countByAssigneeAndStatus(responderId, "Acknowledged")
            + incidents.countByAssigneeAndStatus(responderId, "In Progress")
            + incidents.countByAssigneeAndStatus(responderId, "Investigating"),
        "resolved", incidents.countByAssigneeAndStatus(responderId, "Resolved"),
        "unassignedAvailable", unassigned.size(),
        "needsReview", incidents.countBySeverityReviewStatus("NeedsReview"),
        "slaAtRisk", nearSla.size() + breached.size()
    ));
    payload.put("bySeverity", groupMap(incidents.countBySeverityForAssignee(responderId)));
    payload.put("assigned", assigned.stream().map(this::incidentCard).toList());
    payload.put("unassigned", unassigned.stream().map(this::incidentCard).toList());
    payload.put("nearSla", nearSla.stream().map(this::incidentCard).toList());
    payload.put("slaBreached", breached.stream().map(this::incidentCard).toList());
    payload.put("severityReview", review.stream().map(this::incidentCard).toList());
    payload.put("notifications", activities.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 10)));
    return payload;
  }

  private Map<String, Object> adminDashboard() {
    Instant now = Instant.now();
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("role", "Admin");
    payload.put("summary", Map.of(
        "total", incidents.count(),
        "open", incidents.countByStatus("Open"),
        "assigned", incidents.countByAssigneeIsNotNull(),
        "inProgress", incidents.countByStatus("In Progress") + incidents.countByStatus("Investigating") + incidents.countByStatus("Acknowledged"),
        "resolved", incidents.countByStatus("Resolved"),
        "closed", incidents.countByStatus("Closed"),
        "unassigned", incidents.countByAssigneeIsNullAndStatusNotIn(CLOSED_STATUSES),
        "slaBreached", incidents.countBySlaOverdueTrueAndStatusNotIn(CLOSED_STATUSES)
    ));
    payload.put("statusCounts", statusCounts());
    payload.put("bySeverity", groupMap(incidents.countBySeverityGroup()));
    payload.put("byCategory", groupMap(incidents.countByCategoryGroup()));
    payload.put("unassigned", incidents.findByAssigneeIsNullAndStatusNotOrderByCreatedAtAsc("Resolved", PageRequest.of(0, 25))
        .stream().filter(incident -> !"Closed".equals(incident.getStatus())).map(this::incidentCard).toList());
    payload.put("nearSla", incidents.findDashboardNearSla(now, 80, 25).stream().map(this::incidentCard).toList());
    payload.put("slaBreached", incidents.findDashboardSlaBreached(now, 25).stream().map(this::incidentCard).toList());
    payload.put("responderWorkloads", users.findByRole("Responder").stream().map(this::workload).toList());
    payload.put("averageResolutionTime", formatDuration(incidents.averageResolutionSeconds()));
    payload.put("trends", incidents.incidentTrend(now.minus(Duration.ofDays(14))).stream()
        .map(row -> Map.of("date", String.valueOf(row[0]), "count", ((Number) row[1]).longValue()))
        .toList());
    payload.put("users", Map.of(
        "total", users.count(),
        "reporters", users.findByRole("Reporter").size(),
        "responders", users.findByRole("Responder").size(),
        "admins", users.findByRole("Admin").size()
    ));
    payload.put("notifications", activities.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 10)));
    return payload;
  }

  private Map<String, Object> workload(User responder) {
    return Map.of(
        "id", responder.getId(),
        "name", responder.getName(),
        "assigned", incidents.countByAssignee(responder.getId()),
        "open", incidents.countByAssigneeAndStatus(responder.getId(), "Open")
            + incidents.countByAssigneeAndStatus(responder.getId(), "Acknowledged")
            + incidents.countByAssigneeAndStatus(responder.getId(), "In Progress")
            + incidents.countByAssigneeAndStatus(responder.getId(), "Investigating"),
        "resolved", incidents.countByAssigneeAndStatus(responder.getId(), "Resolved")
    );
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

  private Map<String, Object> incidentCard(Incident incident) {
    Map<String, Object> map = new LinkedHashMap<>();
    map.put("_id", incident.getId());
    map.put("title", incident.getTitle());
    map.put("description", incident.getDescription());
    map.put("status", incident.getStatus());
    map.put("severity", incident.getSeverity());
    map.put("category", incident.getCategory());
    map.put("owner", incident.getOwner());
    map.put("assignee", incident.getAssignee());
    map.put("dueAt", incident.getDueAt());
    map.put("createdAt", incident.getCreatedAt());
    map.put("updatedAt", incident.getUpdatedAt());
    map.put("severityReviewStatus", incident.getSeverityReviewStatus());
    map.put("slaOverdue", incident.isSlaOverdue());
    map.put("score", priority.score(incident));
    return map;
  }

  private static String formatDuration(Double seconds) {
    if (seconds == null || seconds <= 0) return "n/a";
    long totalMinutes = Math.round(seconds / 60.0);
    long hours = totalMinutes / 60;
    long minutes = totalMinutes % 60;
    return hours > 0 ? hours + "h " + minutes + "m" : minutes + "m";
  }
}
