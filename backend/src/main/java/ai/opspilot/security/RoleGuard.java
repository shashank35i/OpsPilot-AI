package ai.opspilot.security;

import org.springframework.stereotype.Component;

@Component
public class RoleGuard {
  public void requireReporter(UserPrincipal user) {
    requireAny(user, "Reporter", "Admin");
  }

  public void requireResponder(UserPrincipal user) {
    requireAny(user, "Responder", "Admin");
  }

  public void requireAdmin(UserPrincipal user) {
    requireAny(user, "Admin");
  }

  public void requireAny(UserPrincipal user, String... roles) {
    if (user == null) throw new AuthException("Missing token", 401);
    for (String role : roles) {
      if (role.equals(user.role())) return;
    }
    throw new AuthException("Forbidden", 403);
  }
}
