package ai.opspilot.service;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;

class CacheServiceTest {
  @Test
  void deletesKeysByPrefixWhenRedisIsAvailable() {
    StringRedisTemplate redis = mock(StringRedisTemplate.class);
    Set<String> keys = Set.of("dashboard:admin", "dashboard:reporter:user-1");
    when(redis.keys("dashboard:*")).thenReturn(keys);
    CacheService cache = new CacheService(Optional.of(redis), new ObjectMapper());

    cache.deleteByPrefix("dashboard:");

    verify(redis).delete(keys);
  }
}
