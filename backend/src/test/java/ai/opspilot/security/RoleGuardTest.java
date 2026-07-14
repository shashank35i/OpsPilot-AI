package ai.opspilot.security;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class RoleGuardTest {
  private final RoleGuard guard = new RoleGuard();

  @Test
  void allowsAdminToUseResponderActions() {
    guard.requireResponder(principal("Admin"));
  }

  @Test
  void blocksReporterFromResponderActions() {
    assertThatThrownBy(() -> guard.requireResponder(principal("Reporter")))
        .isInstanceOf(AuthException.class)
        .hasMessage("Forbidden");
  }

  private static UserPrincipal principal(String role) {
    return new UserPrincipal("user-1", "user@example.com", "User", role, "session-1", "token-1");
  }
}
