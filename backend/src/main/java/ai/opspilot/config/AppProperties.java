package ai.opspilot.config;

import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "opspilot")
public class AppProperties {
  private String clientOrigin = "http://localhost:5173";
  private String jwtSecret = "dev_secret_change";
  private long jwtTtlHours = 8;
  private String seedOnStart = "0";
  private String version = "1.0.0";
  private boolean slaOverdueSchedulerEnabled = true;
  private long slaOverdueSchedulerDelayMs = 60_000;
  private int slaOverdueBatchSize = 100;
  private int slaNearThresholdPercent = 80;
  private int unassignedAlertMinutes = 15;
  private String geminiApiKey = "";
  private String geminiModel = "gemini-1.5-flash";

  public List<String> allowedOrigins() {
    return clientOrigin == null || clientOrigin.isBlank()
        ? List.of()
        : List.of(clientOrigin.split(",")).stream().map(String::trim).filter(s -> !s.isBlank()).toList();
  }

  public Duration jwtTtl() {
    return Duration.ofHours(jwtTtlHours);
  }

  public boolean shouldSeed() {
    return "1".equals(seedOnStart) || "true".equalsIgnoreCase(seedOnStart);
  }

  public String getClientOrigin() { return clientOrigin; }
  public void setClientOrigin(String clientOrigin) { this.clientOrigin = clientOrigin; }
  public String getJwtSecret() { return jwtSecret; }
  public void setJwtSecret(String jwtSecret) { this.jwtSecret = jwtSecret; }
  public long getJwtTtlHours() { return jwtTtlHours; }
  public void setJwtTtlHours(long jwtTtlHours) { this.jwtTtlHours = jwtTtlHours; }
  public String getSeedOnStart() { return seedOnStart; }
  public void setSeedOnStart(String seedOnStart) { this.seedOnStart = seedOnStart; }
  public String getVersion() { return version; }
  public void setVersion(String version) { this.version = version; }
  public boolean isSlaOverdueSchedulerEnabled() { return slaOverdueSchedulerEnabled; }
  public void setSlaOverdueSchedulerEnabled(boolean slaOverdueSchedulerEnabled) { this.slaOverdueSchedulerEnabled = slaOverdueSchedulerEnabled; }
  public long getSlaOverdueSchedulerDelayMs() { return slaOverdueSchedulerDelayMs; }
  public void setSlaOverdueSchedulerDelayMs(long slaOverdueSchedulerDelayMs) { this.slaOverdueSchedulerDelayMs = slaOverdueSchedulerDelayMs; }
  public int getSlaOverdueBatchSize() { return slaOverdueBatchSize; }
  public void setSlaOverdueBatchSize(int slaOverdueBatchSize) { this.slaOverdueBatchSize = slaOverdueBatchSize; }
  public int getSlaNearThresholdPercent() { return slaNearThresholdPercent; }
  public void setSlaNearThresholdPercent(int slaNearThresholdPercent) { this.slaNearThresholdPercent = slaNearThresholdPercent; }
  public int getUnassignedAlertMinutes() { return unassignedAlertMinutes; }
  public void setUnassignedAlertMinutes(int unassignedAlertMinutes) { this.unassignedAlertMinutes = unassignedAlertMinutes; }
  public String getGeminiApiKey() { return geminiApiKey; }
  public void setGeminiApiKey(String geminiApiKey) { this.geminiApiKey = geminiApiKey; }
  public String getGeminiModel() { return geminiModel; }
  public void setGeminiModel(String geminiModel) { this.geminiModel = geminiModel; }
}
