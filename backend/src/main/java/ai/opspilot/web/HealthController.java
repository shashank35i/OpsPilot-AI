package ai.opspilot.web;

import ai.opspilot.config.AppProperties;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
public class HealthController {
  private final AppProperties properties;
  private final Optional<StringRedisTemplate> redis;
  private final Instant startedAt = Instant.now();

  public HealthController(AppProperties properties, Optional<StringRedisTemplate> redis) {
    this.properties = properties;
    this.redis = redis;
  }

  @GetMapping
  Map<String, Object> health() {
    return Map.of(
        "ok", true,
        "service", "opspilot-backend",
        "version", properties.getVersion(),
        "redis", redisStatus(),
        "uptimeSeconds", Instant.now().getEpochSecond() - startedAt.getEpochSecond(),
        "timestamp", Instant.now().toString()
    );
  }

  private String redisStatus() {
    if (redis.isEmpty()) return "disabled";
    try {
      String pong = redis.get().execute((RedisCallback<String>) connection -> connection.ping());
      return pong == null ? "unknown" : "ready";
    } catch (Exception e) {
      return "unavailable";
    }
  }
}
