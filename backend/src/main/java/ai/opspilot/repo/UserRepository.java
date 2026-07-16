package ai.opspilot.repo;

import ai.opspilot.model.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, String> {
  Optional<User> findByEmail(String email);
  List<User> findByRole(String role);
  boolean existsByEmail(String email);
}
