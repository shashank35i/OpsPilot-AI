package ai.opspilot.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "sla_policies")
public class SlaPolicy extends BaseEntity {
  @Column(nullable = false, unique = true)
  private String severity;
  @Column(nullable = false)
  private int thresholdMinutes;

  public String getSeverity() { return severity; }
  public void setSeverity(String severity) { this.severity = severity; }
  public int getThresholdMinutes() { return thresholdMinutes; }
  public void setThresholdMinutes(int thresholdMinutes) { this.thresholdMinutes = thresholdMinutes; }
}
