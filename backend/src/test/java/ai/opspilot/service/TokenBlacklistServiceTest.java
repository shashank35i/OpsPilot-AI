package ai.opspilot.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ai.opspilot.model.BlacklistedToken;
import ai.opspilot.repo.BlacklistedTokenRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.StringRedisTemplate;

class TokenBlacklistServiceTest {
  @Test
  void usesDatabaseFallbackWhenRedisIsUnavailable() {
    BlacklistedTokenRepository repository = mock(BlacklistedTokenRepository.class);
    TokenBlacklistService service = new TokenBlacklistService(Optional.<StringRedisTemplate>empty(), repository);

    service.blacklist("token-1", "session-1", "user-1", Instant.now().plusSeconds(300), "logout");

    ArgumentCaptor<BlacklistedToken> captor = ArgumentCaptor.forClass(BlacklistedToken.class);
    verify(repository).save(captor.capture());
    assertThat(captor.getValue().getTokenId()).isEqualTo("token-1");
    assertThat(captor.getValue().getReason()).isEqualTo("logout");
  }

  @Test
  void checksDatabaseFallbackWhenRedisIsUnavailable() {
    BlacklistedTokenRepository repository = mock(BlacklistedTokenRepository.class);
    when(repository.existsById("token-1")).thenReturn(true);
    TokenBlacklistService service = new TokenBlacklistService(Optional.<StringRedisTemplate>empty(), repository);

    assertThat(service.isBlacklisted("token-1")).isTrue();
  }
}
