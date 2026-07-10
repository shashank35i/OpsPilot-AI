package ai.opspilot.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "blacklisted_tokens", indexes = {
    @Index(name = "idx_blacklisted_tokens_session", columnList = "session_id"),
    @Index(name = "idx_blacklisted_tokens_user", columnList = "user_id"),
    @Index(name = "idx_blacklisted_tokens_expires", columnList = "expires_at")
})
public class BlacklistedToken {
  @Id
  @Column(name = "token_id", length = 36, nullable = false, updatable = false)
  private String tokenId;
  @Column(name = "session_id", length = 36)
  private String sessionId;
  @Column(name = "user_id", length = 36)
  private String userId;
  private String reason;
  @Column(name = "expires_at")
  private Instant expiresAt;
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void prePersist() {
    if (createdAt == null) createdAt = Instant.now();
  }

  public String getTokenId() { return tokenId; }
  public void setTokenId(String tokenId) { this.tokenId = tokenId; }
  public String getSessionId() { return sessionId; }
  public void setSessionId(String sessionId) { this.sessionId = sessionId; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getReason() { return reason; }
  public void setReason(String reason) { this.reason = reason; }
  public Instant getExpiresAt() { return expiresAt; }
  public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
