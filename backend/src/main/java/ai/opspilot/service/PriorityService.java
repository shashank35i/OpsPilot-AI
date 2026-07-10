package ai.opspilot.service;

import ai.opspilot.model.Incident;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class PriorityService {
  private static final Map<String, Integer> SEVERITY = Map.of("Low", 1, "Medium", 2, "High", 3, "Critical", 5);
  private static final Map<String, Integer> STATUS = Map.of("Open", 3, "Investigating", 2, "Mitigated", 1, "Resolved", 0);
  private static final List<Map<String, Object>> THRESHOLDS = List.of(
      Map.of("label", "Critical", "min", 121),
      Map.of("label", "High", "min", 81),
      Map.of("label", "Medium", "min", 46),
      Map.of("label", "Low", "min", 0)
  );

  public Map<String, Object> model() {
    return Map.of(
        "name", "OpsPilot Priority Model",
        "version", "1.1",
        "weights", Map.of(
            "severity", SEVERITY,
            "status", STATUS,
            "ageHoursCap", 72,
            "severityMultiplier", 15,
            "statusMultiplier", 10,
            "ageMultiplier", 1
        ),
        "thresholds", THRESHOLDS
    );
  }

  public Map<String, Object> score(Incident incident) {
    int severity = SEVERITY.getOrDefault(incident.getSeverity(), 2);
    int status = STATUS.getOrDefault(incident.getStatus(), 1);
    double ageHours = 1;
    if (incident.getCreatedAt() != null) {
      ageHours = Math.min(72, Duration.between(incident.getCreatedAt(), Instant.now()).toMillis() / 3_600_000.0);
    }
    int score = (int) Math.round(severity * 15 + status * 10 + ageHours);
    String label = THRESHOLDS.stream()
        .filter(t -> score >= (Integer) t.get("min"))
        .map(t -> (String) t.get("label"))
        .findFirst()
        .orElse("Low");
    return Map.of("score", score, "label", label);
  }

  public Map<String, Object> summarize(Incident incident) {
    String title = incident.getTitle() == null || incident.getTitle().isBlank() ? "Incident" : incident.getTitle();
    String severity = incident.getSeverity() == null ? "Medium" : incident.getSeverity();
    String status = incident.getStatus() == null ? "Open" : incident.getStatus();
    return Map.of(
        "summary", "Summary: " + title + " is " + status.toLowerCase() + " with " + severity.toLowerCase() + " severity.\n",
        "plan", "Action plan: confirm impact, assign owner, communicate ETA, and track mitigation steps."
    );
  }
}
