package ai.opspilot.service;

import ai.opspilot.model.Activity;
import ai.opspilot.repo.ActivityRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ActivityService {
  private final ActivityRepository activities;

  public ActivityService(ActivityRepository activities) {
    this.activities = activities;
  }

  public void log(String actor, String type, String entityType, String entityId, String message) {
    log(actor, type, entityType, entityId, message, Map.of());
  }

  public void log(String actor, String type, String entityType, String entityId, String message, Map<String, Object> metadata) {
    try {
      Activity activity = new Activity();
      activity.setActor(actor);
      activity.setType(type);
      activity.setEntityType(entityType);
      activity.setEntityId(entityId);
      activity.setMessage(message);
      activity.setMetadata(metadata);
      activities.save(activity);
    } catch (RuntimeException ignored) {
      // Activity logging must not block operational writes.
    }
  }
}
