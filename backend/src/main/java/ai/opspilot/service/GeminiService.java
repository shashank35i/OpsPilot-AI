package ai.opspilot.service;

import ai.opspilot.config.AppProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class GeminiService {
  private final AppProperties properties;
  private final ObjectMapper mapper;
  private final HttpClient client = HttpClient.newHttpClient();

  public GeminiService(AppProperties properties, ObjectMapper mapper) {
    this.properties = properties;
    this.mapper = mapper;
  }

  public SeverityAssessment assessSeverity(String title, String description, String reporterSeverity) {
    String predicted = callGemini(title, description).trim();
    if (!isSeverity(predicted)) predicted = heuristicSeverity(title + " " + description);
    boolean matches = predicted.equals(reporterSeverity);
    String reason = matches
        ? "Gemini severity matched reporter selection."
        : "Gemini suggested " + predicted + " while reporter selected " + reporterSeverity + ".";
    return new SeverityAssessment(predicted, matches, reason);
  }

  public String troubleshootingPlan(String title, String description) {
    if (properties.getGeminiApiKey() == null || properties.getGeminiApiKey().isBlank()) {
      return "Confirm impact, inspect recent changes, check service health, apply mitigation, and validate recovery.";
    }
    String prompt = "Give a concise incident troubleshooting plan for: " + title + "\n" + description;
    String response = callGeminiPrompt(prompt);
    return response.isBlank()
        ? "Confirm impact, inspect recent changes, check service health, apply mitigation, and validate recovery."
        : response;
  }

  private String callGemini(String title, String description) {
    if (properties.getGeminiApiKey() == null || properties.getGeminiApiKey().isBlank()) return "";
    String prompt = """
        Classify this incident severity as exactly one word: Low, Medium, High, or Critical.
        Title: %s
        Description: %s
        """.formatted(title, description);
    return callGeminiPrompt(prompt);
  }

  private String callGeminiPrompt(String prompt) {
    try {
      String url = "https://generativelanguage.googleapis.com/v1beta/models/"
          + properties.getGeminiModel()
          + ":generateContent?key="
          + properties.getGeminiApiKey();
      Map<String, Object> body = Map.of(
          "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
      );
      HttpRequest request = HttpRequest.newBuilder(URI.create(url))
          .header("Content-Type", "application/json")
          .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
          .build();
      HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() >= 300) return "";
      JsonNode text = mapper.readTree(response.body()).at("/candidates/0/content/parts/0/text");
      return text.isMissingNode() ? "" : text.asText().trim();
    } catch (Exception ignored) {
      return "";
    }
  }

  private static String heuristicSeverity(String text) {
    String value = text == null ? "" : text.toLowerCase();
    if (value.matches(".*(outage|down|unavailable|data loss|payment failed|security breach|crash).*")) return "Critical";
    if (value.matches(".*(latency|degraded|error spike|timeout|major|blocked).*")) return "High";
    if (value.matches(".*(delayed|intermittent|warning|minor).*")) return "Medium";
    return "Low";
  }

  private static boolean isSeverity(String severity) {
    return severity != null && severity.matches("Low|Medium|High|Critical");
  }

  public record SeverityAssessment(String predictedSeverity, boolean matchesReporter, String reason) {}
}
