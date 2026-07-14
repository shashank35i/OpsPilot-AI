package ai.opspilot.service;

import ai.opspilot.model.SlaPolicy;
import ai.opspilot.repo.SlaPolicyRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SlaPolicyService {
  private final SlaPolicyRepository policies;

  public SlaPolicyService(SlaPolicyRepository policies) {
    this.policies = policies;
  }

  public int thresholdMinutesFor(String severity) {
    return policies.findBySeverity(severity)
        .map(SlaPolicy::getThresholdMinutes)
        .orElse(defaultMinutes(severity));
  }

  public List<SlaPolicy> all() {
    return policies.findAll();
  }

  public SlaPolicy upsert(String severity, int thresholdMinutes) {
    if (!isSeverity(severity) || thresholdMinutes < 1) {
      throw new IllegalArgumentException("Invalid SLA policy");
    }
    SlaPolicy policy = policies.findBySeverity(severity).orElseGet(SlaPolicy::new);
    policy.setSeverity(severity);
    policy.setThresholdMinutes(thresholdMinutes);
    return policies.save(policy);
  }

  public void seedDefaults() {
    upsertIfMissing("Critical", 15);
    upsertIfMissing("High", 60);
    upsertIfMissing("Medium", 240);
    upsertIfMissing("Low", 1440);
  }

  private void upsertIfMissing(String severity, int minutes) {
    if (policies.findBySeverity(severity).isPresent()) return;
    SlaPolicy policy = new SlaPolicy();
    policy.setSeverity(severity);
    policy.setThresholdMinutes(minutes);
    policies.save(policy);
  }

  private static int defaultMinutes(String severity) {
    return switch (severity == null ? "" : severity) {
      case "Critical" -> 15;
      case "High" -> 60;
      case "Low" -> 1440;
      default -> 240;
    };
  }

  private static boolean isSeverity(String severity) {
    return severity != null && severity.matches("Low|Medium|High|Critical");
  }
}
