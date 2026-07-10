package ai.opspilot.web;

import ai.opspilot.model.Task;
import ai.opspilot.repo.TaskRepository;
import ai.opspilot.security.UserPrincipal;
import ai.opspilot.service.ActivityService;
import ai.opspilot.service.CacheService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Duration;
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
@RequestMapping("/api/tasks")
public class TaskController {
  private final TaskRepository tasks;
  private final ActivityService activity;
  private final CacheService cache;

  public TaskController(TaskRepository tasks, ActivityService activity, CacheService cache) {
    this.tasks = tasks;
    this.activity = activity;
    this.cache = cache;
  }

  @GetMapping
  Map<String, Object> list(@RequestParam(defaultValue = "") String q) {
    String cleanQ = q.trim();
    if (cleanQ.isBlank()) {
      var cached = cache.get("tasks:all", Map.class);
      if (cached.isPresent()) return cached.get();
    }
    List<Task> found = cleanQ.isBlank()
        ? tasks.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 200))
        : tasks.findByTitleContainingIgnoreCaseOrderByCreatedAtDesc(cleanQ, PageRequest.of(0, 200));
    Map<String, Object> payload = Map.of("items", found);
    if (cleanQ.isBlank()) cache.set("tasks:all", payload, Duration.ofSeconds(20));
    return payload;
  }

  @PostMapping
  Map<String, Object> create(@AuthenticationPrincipal UserPrincipal user, @Valid @RequestBody TaskCreateRequest request) {
    validateStatus(request.status());
    validatePriority(request.priority());
    Task task = new Task();
    task.setTitle(request.title().trim());
    task.setStatus(defaultValue(request.status(), "Todo"));
    task.setPriority(defaultValue(request.priority(), "Medium"));
    task.setIncident(request.incident());
    tasks.save(task);
    activity.log(user.id(), "TASK_CREATED", "Task", task.getId(), "Task created: " + task.getTitle());
    cache.delete(List.of("tasks:all", "analytics:summary", "activities:latest"));
    return Map.of("item", task);
  }

  @PatchMapping("/{id}")
  Map<String, Object> update(@AuthenticationPrincipal UserPrincipal user, @PathVariable String id, @RequestBody TaskUpdateRequest request) {
    validateStatus(request.status());
    validatePriority(request.priority());
    Task task = tasks.findById(id).orElseThrow(() -> new IllegalArgumentException("Task not found"));
    Map<String, Object> metadata = new LinkedHashMap<>();
    if (request.status() != null) { task.setStatus(request.status()); metadata.put("status", request.status()); }
    if (request.priority() != null) { task.setPriority(request.priority()); metadata.put("priority", request.priority()); }
    if (request.title() != null) { task.setTitle(request.title().trim()); metadata.put("title", request.title()); }
    tasks.save(task);
    activity.log(user.id(), "TASK_UPDATED", "Task", task.getId(), "Task updated: " + task.getTitle(), metadata);
    cache.delete(List.of("tasks:all", "analytics:summary", "activities:latest"));
    return Map.of("item", task);
  }

  private static String defaultValue(String value, String fallback) {
    return value == null || value.isBlank() ? fallback : value;
  }

  private static void validateStatus(String status) {
    if (status != null && !status.matches("Todo|In Progress|Done")) throw new IllegalArgumentException("Invalid status");
  }

  private static void validatePriority(String priority) {
    if (priority != null && !priority.matches("Low|Medium|High")) throw new IllegalArgumentException("Invalid priority");
  }

  record TaskCreateRequest(
      @NotBlank @Size(min = 3) String title,
      String status,
      String priority,
      String incident
  ) {}

  record TaskUpdateRequest(String status, String priority, @Size(min = 3) String title) {}
}
