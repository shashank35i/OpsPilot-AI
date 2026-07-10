package ai.opspilot.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "tasks", indexes = {
    @Index(name = "idx_tasks_status", columnList = "status"),
    @Index(name = "idx_tasks_created", columnList = "created_at")
})
public class Task extends BaseEntity {
  @Column(nullable = false)
  private String title;
  private String status = "Todo";
  private String priority = "Medium";
  @Column(length = 36)
  private String incident;
  @Column(length = 36)
  private String assignee;
  @Column(name = "due_at")
  private Instant dueAt;

  @JsonProperty("_id")
  public String getJsonId() { return id; }

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public String getPriority() { return priority; }
  public void setPriority(String priority) { this.priority = priority; }
  public String getIncident() { return incident; }
  public void setIncident(String incident) { this.incident = incident; }
  public String getAssignee() { return assignee; }
  public void setAssignee(String assignee) { this.assignee = assignee; }
  public Instant getDueAt() { return dueAt; }
  public void setDueAt(Instant dueAt) { this.dueAt = dueAt; }
}
