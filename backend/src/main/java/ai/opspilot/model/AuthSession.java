package ai.opspilot.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "auth_sessions", indexes = {
    @Index(name = "idx_auth_sessions_user", columnList = "user_id"),
    @Index(name = "idx_auth_sessions_token", columnList = "token_id", unique = true)
})
public class AuthSession extends BaseEntity {
  @Column(name = "user_id", length = 36, nullable = false)
  private String userId;
  @Column(name = "token_id", nullable = false, unique = true, length = 36)
  private String tokenId;
  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;
  @Column(name = "revoked_at")
  private Instant revokedAt;
  @Column(name = "last_seen_at")
  private Instant lastSeenAt;

  public boolean isActive(Instant now) {
    return revokedAt == null && expiresAt != null && expiresAt.isAfter(now);
  }

  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getTokenId() { return tokenId; }
  public void setTokenId(String tokenId) { this.tokenId = tokenId; }
  public Instant getExpiresAt() { return expiresAt; }
  public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
  public Instant getRevokedAt() { return revokedAt; }
  public void setRevokedAt(Instant revokedAt) { this.revokedAt = revokedAt; }
  public Instant getLastSeenAt() { return lastSeenAt; }
  public void setLastSeenAt(Instant lastSeenAt) { this.lastSeenAt = lastSeenAt; }
}
