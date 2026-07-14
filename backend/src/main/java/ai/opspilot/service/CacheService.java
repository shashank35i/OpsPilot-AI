package ai.opspilot.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class CacheService {
  private final Optional<StringRedisTemplate> redis;
  private final ObjectMapper mapper;
  private final AtomicLong hits = new AtomicLong();
  private final AtomicLong misses = new AtomicLong();

  public CacheService(Optional<StringRedisTemplate> redis, ObjectMapper mapper) {
    this.redis = redis;
    this.mapper = mapper;
  }

  public <T> Optional<T> get(String key, Class<T> type) {
    if (redis.isEmpty()) {
      misses.incrementAndGet();
      return Optional.empty();
    }
    try {
      String raw = redis.get().opsForValue().get(key);
      if (raw == null || raw.isBlank()) {
        misses.incrementAndGet();
        return Optional.empty();
      }
      hits.incrementAndGet();
      return Optional.of(mapper.readValue(raw, type));
    } catch (Exception ignored) {
      misses.incrementAndGet();
      return Optional.empty();
    }
  }

  public void set(String key, Object value, Duration ttl) {
    if (redis.isEmpty()) return;
    try {
      redis.get().opsForValue().set(key, mapper.writeValueAsString(value), ttl);
    } catch (Exception ignored) {
      // cache fallback
    }
  }

  public void delete(Collection<String> keys) {
    if (redis.isEmpty() || keys == null || keys.isEmpty()) return;
    try {
      redis.get().delete(keys);
    } catch (Exception ignored) {
      // cache fallback
    }
  }

  public Map<String, Object> metrics() {
    long hitCount = hits.get();
    long missCount = misses.get();
    long total = hitCount + missCount;
    double hitRate = total == 0 ? 0 : Math.round((hitCount * 10000.0) / total) / 100.0;
    return Map.of(
        "hits", hitCount,
        "misses", missCount,
        "totalReads", total,
        "hitRatePercent", hitRate,
        "estimatedDatabaseReadReductionPercent", hitRate
    );
  }
}
