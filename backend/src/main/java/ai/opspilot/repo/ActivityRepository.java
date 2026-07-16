package ai.opspilot.repo;

import ai.opspilot.model.Activity;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityRepository extends JpaRepository<Activity, String> {
  List<Activity> findAllByOrderByCreatedAtDesc(Pageable pageable);
  List<Activity> findByEntityTypeAndEntityIdInOrderByCreatedAtDesc(String entityType, List<String> entityIds, Pageable pageable);
}
