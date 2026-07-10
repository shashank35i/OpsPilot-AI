package ai.opspilot.repo;

import ai.opspilot.model.Task;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, String> {
  List<Task> findByTitleContainingIgnoreCaseOrderByCreatedAtDesc(String title, Pageable pageable);
  List<Task> findAllByOrderByCreatedAtDesc(Pageable pageable);
  long countByStatusNot(String status);
}
