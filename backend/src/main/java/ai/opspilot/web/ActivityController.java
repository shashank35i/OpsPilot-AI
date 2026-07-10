package ai.opspilot.web;

import ai.opspilot.repo.ActivityRepository;
import ai.opspilot.service.CacheService;
import java.time.Duration;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {
  private final ActivityRepository activities;
  private final CacheService cache;

  public ActivityController(ActivityRepository activities, CacheService cache) {
    this.activities = activities;
    this.cache = cache;
  }

  @GetMapping
  Map<String, Object> latest() {
    var cached = cache.get("activities:latest", Map.class);
    if (cached.isPresent()) return cached.get();
    Map<String, Object> payload = Map.of("items", activities.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 50)));
    cache.set("activities:latest", payload, Duration.ofSeconds(15));
    return payload;
  }
}
