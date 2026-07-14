package ai.opspilot.web;

import ai.opspilot.repo.IncidentRepository;
import ai.opspilot.repo.TaskRepository;
import ai.opspilot.service.CacheService;
import ai.opspilot.service.PriorityService;
import java.time.Duration;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AnalyticsController {
  private final IncidentRepository incidents;
  private final TaskRepository tasks;
  private final PriorityService priority;
  private final CacheService cache;

  public AnalyticsController(IncidentRepository incidents, TaskRepository tasks, PriorityService priority, CacheService cache) {
    this.incidents = incidents;
    this.tasks = tasks;
    this.priority = priority;
    this.cache = cache;
  }

  @GetMapping("/analytics/summary")
  Map<String, Object> summary() {
    var cached = cache.get("analytics:summary", Map.class);
    if (cached.isPresent()) return cached.get();
    Map<String, Object> payload = Map.of(
        "incidents", Map.of(
            "open", incidents.countByStatus("Open"),
            "investigating", incidents.countByStatus("Investigating"),
            "mitigated", incidents.countByStatus("Mitigated"),
            "resolved", incidents.countByStatus("Resolved")
        ),
        "tasksOpen", tasks.countByStatusNot("Done")
    );
    cache.set("analytics:summary", payload, Duration.ofSeconds(30));
    return payload;
  }

  @GetMapping("/models/priority")
  Map<String, Object> priorityModel() {
    return Map.of("model", priority.model());
  }

  @GetMapping("/analytics/cache-metrics")
  Map<String, Object> cacheMetrics() {
    return cache.metrics();
  }
}
