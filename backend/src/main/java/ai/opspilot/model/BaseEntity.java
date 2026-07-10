package ai.opspilot.model;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.time.Instant;
import java.util.UUID;

@MappedSuperclass
public abstract class BaseEntity {
  @Id
  @Column(length = 36, nullable = false, updatable = false)
  protected String id;

  @Column(name = "created_at", nullable = false, updatable = false)
  protected Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  protected Instant updatedAt;

  @PrePersist
  void prePersist() {
    if (id == null || id.isBlank()) id = UUID.randomUUID().toString();
    Instant now = Instant.now();
    if (createdAt == null) createdAt = now;
    if (updatedAt == null) updatedAt = now;
  }

  @PreUpdate
  void preUpdate() {
    updatedAt = Instant.now();
  }

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
