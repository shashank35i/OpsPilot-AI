package ai.opspilot.repo;

import ai.opspilot.model.SlaPolicy;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SlaPolicyRepository extends JpaRepository<SlaPolicy, String> {
  Optional<SlaPolicy> findBySeverity(String severity);
}
