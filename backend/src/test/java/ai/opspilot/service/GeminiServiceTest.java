package ai.opspilot.service;

import static org.assertj.core.api.Assertions.assertThat;

import ai.opspilot.config.AppProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class GeminiServiceTest {
  @Test
  void fallsBackToLocalSeverityHeuristicWhenApiKeyMissing() {
    AppProperties properties = new AppProperties();
    properties.setGeminiApiKey("");
    GeminiService service = new GeminiService(properties, new ObjectMapper());

    GeminiService.SeverityAssessment assessment = service.assessSeverity(
        "Checkout outage",
        "Payment service is down and users cannot complete orders.",
        "Medium"
    );

    assertThat(assessment.predictedSeverity()).isEqualTo("Critical");
    assertThat(assessment.matchesReporter()).isFalse();
    assertThat(assessment.reason()).contains("Critical").contains("Medium");
  }
}
