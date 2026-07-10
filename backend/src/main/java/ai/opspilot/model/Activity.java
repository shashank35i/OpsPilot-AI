package ai.opspilot.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.util.LinkedHashMap;
import java.util.Map;

@Entity
@Table(name = "activities", indexes = {
    @Index(name = "idx_activities_created", columnList = "created_at")
})
public class Activity extends BaseEntity {
  @Column(length = 36)
  private String actor;
  @Column(nullable = false)
  private String type;
  @Column(nullable = false)
  private String entityType;
  @Column(length = 36)
  private String entityId;
  @Column(columnDefinition = "TEXT")
  private String message = "";
  @Convert(converter = MetadataConverter.class)
  @Column(columnDefinition = "TEXT")
  private Map<String, Object> metadata = new LinkedHashMap<>();

  @JsonProperty("_id")
  public String getJsonId() { return id; }

  public String getActor() { return actor; }
  public void setActor(String actor) { this.actor = actor; }
  public String getType() { return type; }
  public void setType(String type) { this.type = type; }
  public String getEntityType() { return entityType; }
  public void setEntityType(String entityType) { this.entityType = entityType; }
  public String getEntityId() { return entityId; }
  public void setEntityId(String entityId) { this.entityId = entityId; }
  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }
  public Map<String, Object> getMetadata() { return metadata; }
  public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata == null ? new LinkedHashMap<>() : metadata; }
}
