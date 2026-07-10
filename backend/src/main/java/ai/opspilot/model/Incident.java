package ai.opspilot.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "incidents", indexes = {
    @Index(name = "idx_incidents_status_created", columnList = "status, created_at"),
    @Index(name = "idx_incidents_sla_due", columnList = "sla_overdue, due_at, status"),
    @Index(name = "idx_incidents_due", columnList = "due_at")
})
public class Incident extends BaseEntity {
  @Column(nullable = false)
  private String title;
  @Column(columnDefinition = "TEXT")
  private String description = "";
  private String severity = "Medium";
  private String status = "Open";
  @Column(length = 36)
  private String owner;
  @Column(length = 36)
  private String assignee;
  @Convert(converter = StringListConverter.class)
  @Column(columnDefinition = "TEXT")
  private List<String> tags = new ArrayList<>();
  @Column(name = "sla_hours")
  private Integer slaHours = 24;
  @Column(name = "due_at")
  private Instant dueAt;
  @Column(name = "sla_overdue", nullable = false)
  private boolean slaOverdue = false;
  @Column(name = "sla_overdue_at")
  private Instant slaOverdueAt;

  @JsonProperty("_id")
  public String getJsonId() { return id; }

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public String getSeverity() { return severity; }
  public void setSeverity(String severity) { this.severity = severity; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public String getOwner() { return owner; }
  public void setOwner(String owner) { this.owner = owner; }
  public String getAssignee() { return assignee; }
  public void setAssignee(String assignee) { this.assignee = assignee; }
  public List<String> getTags() { return tags; }
  public void setTags(List<String> tags) { this.tags = tags == null ? new ArrayList<>() : tags; }
  public Integer getSlaHours() { return slaHours; }
  public void setSlaHours(Integer slaHours) { this.slaHours = slaHours; }
  public Instant getDueAt() { return dueAt; }
  public void setDueAt(Instant dueAt) { this.dueAt = dueAt; }
  public boolean isSlaOverdue() { return slaOverdue; }
  public void setSlaOverdue(boolean slaOverdue) { this.slaOverdue = slaOverdue; }
  public Instant getSlaOverdueAt() { return slaOverdueAt; }
  public void setSlaOverdueAt(Instant slaOverdueAt) { this.slaOverdueAt = slaOverdueAt; }
}
