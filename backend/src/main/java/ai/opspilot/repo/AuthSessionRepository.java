package ai.opspilot.repo;

import ai.opspilot.model.AuthSession;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthSessionRepository extends JpaRepository<AuthSession, String> {
  Optional<AuthSession> findByTokenId(String tokenId);
}
