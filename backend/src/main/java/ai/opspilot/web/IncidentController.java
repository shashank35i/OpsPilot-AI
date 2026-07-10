package ai.opspilot.web;

import ai.opspilot.model.Incident;
import ai.opspilot.model.Task;
import ai.opspilot.repo.IncidentRepository;
import ai.opspilot.repo.TaskRepository;
import ai.opspilot.security.UserPrincipal;
import ai.opspilot.service.ActivityService;
import ai.opspilot.service.CacheService;
import ai.opspilot.service.PriorityService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class IncidentController {
  private static final List<String> INCIDENT_CACHE_KEYS = List.of(
      "incidents:all", "incidents:Open", "incidents:Investigating", "incidents:Mitigated", "incidents:Resolved");

  private final IncidentRepository incidents;
  private final TaskRepository tasks;
  private final PriorityService priority;
  private final ActivityService activity;
  private final CacheService cache;

  public IncidentController(
      IncidentRepository incidents,
      TaskRepository tasks,
      PriorityService priority,
      ActivityService activity,
      CacheService cache
  ) {
    this.incidents = incidents;
    this.tasks = tasks;
    this.priority = priority;
    this.activity = activity;
    this.cache = cache;
  }

  @GetMapping("/incidents")
  Map<String, Object> list(@RequestParam(defaultValue = "") String status, @RequestParam(defaultValue = "") String q) {
    String cleanStatus = status.trim();
    String cleanQ = q.trim();
    String cacheKey = "incidents:" + (cleanStatus.isBlank() ? "all" : cleanStatus);
    if (cleanQ.isBlank()) {
      var cached = cache.get(cacheKey, Map.class);
      if (cached.isPresent()) return cached.get();
    }

    PageRequest page = PageRequest.of(0, 200);
    List<Incident> found;
    if (!cleanStatus.isBlank() && !cleanQ.isBlank()) {
      found = incidents.findByStatusAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(cleanStatus, cleanQ, page);
    } else if (!cleanStatus.isBlank()) {
      found = incidents.findByStatusOrderByCreatedAtDesc(cleanStatus, page);
    } else if (!cleanQ.isBlank()) {
      found = incidents.findByTitleContainingIgnoreCaseOrderByCreatedAtDesc(cleanQ, page);
    } else {
      found = incidents.findAllByOrderByCreatedAtDesc(page);
    }

    Map<String, Object> payload = Map.of("items", found.stream().map(this::withScore).toList());
    if (cleanQ.isBlank()) cache.set(cacheKey, payload, Duration.ofSeconds(20));
    return payload;
  }

  @PostMapping("/incidents")
  Map<String, Object> create(@AuthenticationPrincipal UserPrincipal user, @Valid @RequestBody IncidentCreateRequest request) {
    validateSeverity(request.severity());
    Incident incident = new Incident();
    incident.setTitle(request.title().trim());
    incident.setDescription(request.description() == null ? "" : request.description());
    incident.setSeverity(defaultValue(request.severity(), "Medium"));
    incident.setOwner(user.id());
    incident.setTags(request.tags());
    incident.setSlaHours(request.slaHours() == null ? 24 : request.slaHours());
    if (request.slaHours() != null) {
      incident.setDueAt(Instant.now().plus(Duration.ofHours(request.slaHours())));
    }
    incidents.save(incident);
    activity.log(user.id(), "INCIDENT_CREATED", "Incident", incident.getId(), "Incident created: " + incident.getTitle());
    cache.delete(keys("analytics:summary", "activities:latest", INCIDENT_CACHE_KEYS));
    return Map.of("item", incident);
  }

  @PatchMapping("/incidents/{id}")
  Map<String, Object> update(@AuthenticationPrincipal UserPrincipal user, @PathVariable String id, @RequestBody IncidentUpdateRequest request) {
    validateSeverity(request.severity());
    validateIncidentStatus(request.status());
    Incident incident = incidents.findById(id).orElseThrow(() -> new IllegalArgumentException("Incident not found"));
    Map<String, Object> metadata = new LinkedHashMap<>();
    if (request.status() != null) { incident.setStatus(request.status()); metadata.put("status", request.status()); }
    if (request.assignee() != null) { incident.setAssignee(request.assignee()); metadata.put("assignee", request.assignee()); }
    if (request.severity() != null) { incident.setSeverity(request.severity()); metadata.put("severity", request.severity()); }
    if (request.description() != null) { incident.setDescription(request.description()); metadata.put("description", request.description()); }
    if (request.tags() != null) { incident.setTags(request.tags()); metadata.put("tags", request.tags()); }
    incidents.save(incident);
    activity.log(user.id(), "INCIDENT_UPDATED", "Incident", incident.getId(), "Incident updated: " + incident.getTitle(), metadata);
    cache.delete(keys("analytics:summary", "activities:latest", INCIDENT_CACHE_KEYS));
    return Map.of("item", incident);
  }

  @PostMapping("/incidents/{id}/auto-tasks")
  Map<String, Object> autoTasks(@AuthenticationPrincipal UserPrincipal user, @PathVariable String id) {
    Incident incident = incidents.findById(id).orElseThrow(() -> new IllegalArgumentException("Incident not found"));
    String priorityValue = "Critical".equals(incident.getSeverity()) || "High".equals(incident.getSeverity()) ? "High" : defaultValue(incident.getSeverity(), "Medium");
    int etaHours = "Critical".equals(incident.getSeverity()) ? 2 : "High".equals(incident.getSeverity()) ? 4 : 8;
    Instant dueAt = Instant.now().plus(Duration.ofHours(etaHours));
    String base = incident.getTitle().trim();

    List<Task> created = new ArrayList<>();
    for (String title : List.of(
        "Triage impact and identify blast radius for \"" + base + "\"",
        "Execute mitigation for \"" + base + "\" and verify rollback path",
        "Publish status update and close post-incident notes for \"" + base + "\"")) {
      Task task = new Task();
      task.setTitle(title);
      task.setPriority(priorityValue);
      task.setIncident(incident.getId());
      task.setDueAt(dueAt);
      created.add(task);
    }
    tasks.saveAll(created);
    activity.log(user.id(), "TASKS_AUTOGENERATED", "Incident", incident.getId(),
        "Auto-generated " + created.size() + " tasks for incident: " + incident.getTitle(),
        Map.of("priority", priorityValue, "etaHours", etaHours));
    cache.delete(keys("tasks:all", "analytics:summary", "activities:latest", INCIDENT_CACHE_KEYS));
    return Map.of("items", created);
  }

  @PostMapping("/ai/incident-summary")
  Map<String, Object> aiSummary(@RequestBody Map<String, Object> body) {
    Object incidentId = body.get("incidentId");
    Incident incident = null;
    if (incidentId != null) {
      incident = incidents.findById(String.valueOf(incidentId)).orElse(null);
    }
    if (incident == null && body.get("incident") instanceof Map<?, ?> raw) {
      incident = new Incident();
      Object title = raw.get("title");
      Object severity = raw.get("severity");
      Object status = raw.get("status");
      incident.setTitle(title == null ? "Incident" : String.valueOf(title));
      incident.setSeverity(severity == null ? "Medium" : String.valueOf(severity));
      incident.setStatus(status == null ? "Open" : String.valueOf(status));
    }
    if (incident == null) throw new IllegalArgumentException("Incident missing");
    Map<String, Object> response = new LinkedHashMap<>(priority.summarize(incident));
    response.put("score", priority.score(incident));
    return response;
  }

  private Map<String, Object> withScore(Incident incident) {
    Map<String, Object> map = new LinkedHashMap<>();
    map.put("_id", incident.getId());
    map.put("title", incident.getTitle());
    map.put("description", incident.getDescription());
    map.put("severity", incident.getSeverity());
    map.put("status", incident.getStatus());
    map.put("owner", incident.getOwner());
    map.put("assignee", incident.getAssignee());
    map.put("tags", incident.getTags());
    map.put("slaHours", incident.getSlaHours());
    map.put("dueAt", incident.getDueAt());
    map.put("slaOverdue", incident.isSlaOverdue());
    map.put("slaOverdueAt", incident.getSlaOverdueAt());
    map.put("createdAt", incident.getCreatedAt());
    map.put("updatedAt", incident.getUpdatedAt());
    map.put("score", priority.score(incident));
    return map;
  }

  private static List<String> keys(String first, String second, List<String> rest) {
    List<String> keys = new ArrayList<>(List.of(first, second));
    keys.addAll(rest);
    return keys;
  }

  private static List<String> keys(String first, String second, String third, List<String> rest) {
    List<String> keys = new ArrayList<>(List.of(first, second, third));
    keys.addAll(rest);
    return keys;
  }

  private static List<String> keys(String first, String second, String third) {
    return List.of(first, second, third);
  }

  private static String defaultValue(String value, String fallback) {
    return value == null || value.isBlank() ? fallback : value;
  }

  private static void validateSeverity(String severity) {
    if (severity != null && !severity.matches("Low|Medium|High|Critical")) throw new IllegalArgumentException("Invalid severity");
  }

  private static void validateIncidentStatus(String status) {
    if (status != null && !status.matches("Open|Investigating|Mitigated|Resolved")) throw new IllegalArgumentException("Invalid status");
  }

  record IncidentCreateRequest(
      @NotBlank @Size(min = 3) String title,
      String description,
      String severity,
      List<String> tags,
      Integer slaHours
  ) {}

  record IncidentUpdateRequest(String status, String assignee, String severity, String description, List<String> tags) {}
}
