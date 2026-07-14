package ai.opspilot.service;

import ai.opspilot.model.BlacklistedToken;
import ai.opspilot.repo.BlacklistedTokenRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class TokenBlacklistService {
  private static final String PREFIX = "jwt:blacklist:";

  private final Optional<StringRedisTemplate> redis;
  private final BlacklistedTokenRepository fallback;

  public TokenBlacklistService(Optional<StringRedisTemplate> redis, BlacklistedTokenRepository fallback) {
    this.redis = redis;
    this.fallback = fallback;
  }

  public boolean isBlacklisted(String tokenId) {
    if (tokenId == null || tokenId.isBlank()) return true;
    if (redis.isPresent()) {
      try {
        return Boolean.TRUE.equals(redis.get().hasKey(PREFIX + tokenId));
      } catch (Exception ignored) {
        // fall through to database fallback
      }
    }
    return fallback.existsById(tokenId);
  }

  public void blacklist(String tokenId, String sessionId, String userId, Instant expiresAt, String reason) {
    if (tokenId == null || tokenId.isBlank()) return;
    if (redis.isPresent()) {
      try {
        long ttlSeconds = Math.max(1, Duration.between(Instant.now(), expiresAt).toSeconds());
        redis.get().opsForValue().set(PREFIX + tokenId, reason == null ? "revoked" : reason, Duration.ofSeconds(ttlSeconds));
      } catch (Exception ignored) {
        // database fallback below
      }
    }

    BlacklistedToken token = new BlacklistedToken();
    token.setTokenId(tokenId);
    token.setSessionId(sessionId);
    token.setUserId(userId);
    token.setReason(reason == null ? "revoked" : reason);
    token.setExpiresAt(expiresAt);
    fallback.save(token);
  }
}
