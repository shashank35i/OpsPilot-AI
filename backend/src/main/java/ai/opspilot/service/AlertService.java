package ai.opspilot.service;

import ai.opspilot.model.Incident;
import java.util.Map;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class AlertService {
  private final SimpMessagingTemplate messaging;
  private final ActivityService activity;

  public AlertService(SimpMessagingTemplate messaging, ActivityService activity) {
    this.messaging = messaging;
    this.activity = activity;
  }

  public void responderAlert(String userId, String type, Incident incident, String message) {
    Map<String, Object> payload = payload(type, incident, message);
    if (userId != null && !userId.isBlank()) {
      messaging.convertAndSend("/queue/users/" + userId + "/alerts", payload);
    }
    messaging.convertAndSend("/topic/responders/alerts", payload);
    activity.log(null, type, "Incident", incident.getId(), message);
  }

  public void adminAlert(String type, Incident incident, String message) {
    Map<String, Object> payload = payload(type, incident, message);
    messaging.convertAndSend("/topic/admin/alerts", payload);
    activity.log(null, type, "Incident", incident.getId(), message);
  }

  public void reporterAlert(String userId, String type, Incident incident, String message) {
    if (userId == null || userId.isBlank()) return;
    Map<String, Object> payload = payload(type, incident, message);
    messaging.convertAndSend("/queue/users/" + userId + "/alerts", payload);
    activity.log(null, type, "Incident", incident.getId(), message);
  }

  private static Map<String, Object> payload(String type, Incident incident, String message) {
    return Map.of(
        "type", type,
        "incidentId", incident.getId(),
        "title", incident.getTitle(),
        "severity", incident.getSeverity(),
        "status", incident.getStatus(),
        "message", message
    );
  }
}
