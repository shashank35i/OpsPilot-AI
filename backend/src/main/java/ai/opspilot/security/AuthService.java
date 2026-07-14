package ai.opspilot.security;

import ai.opspilot.model.AuthSession;
import ai.opspilot.model.User;
import ai.opspilot.repo.AuthSessionRepository;
import ai.opspilot.repo.UserRepository;
import ai.opspilot.service.TokenBlacklistService;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
  private final UserRepository users;
  private final AuthSessionRepository sessions;
  private final TokenBlacklistService tokenBlacklist;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthService(
      UserRepository users,
      AuthSessionRepository sessions,
      TokenBlacklistService tokenBlacklist,
      PasswordEncoder passwordEncoder,
      JwtService jwtService
  ) {
    this.users = users;
    this.sessions = sessions;
    this.tokenBlacklist = tokenBlacklist;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
  }

  public Map<String, Object> register(String name, String email, String password, String role) {
    String normalized = normalizeEmail(email);
    if (users.existsByEmail(normalized)) {
      throw new AuthException("Email already registered", 409);
    }
    User user = new User();
    user.setName(name.trim());
    user.setEmail(normalized);
    user.setPasswordHash(passwordEncoder.encode(password));
    user.setRole(role == null || role.isBlank() ? "Reporter" : role);
    users.save(user);
    return issue(user);
  }

  public Map<String, Object> login(String email, String password) {
    User user = users.findByEmail(normalizeEmail(email))
        .orElseThrow(() -> new AuthException("Invalid credentials", 401));
    if (!passwordEncoder.matches(password, user.getPasswordHash())) {
      throw new AuthException("Invalid credentials", 401);
    }
    return issue(user);
  }

  public Optional<UserPrincipal> authenticate(String token) {
    JwtClaims claims = jwtService.parse(token);
    Instant now = Instant.now();
    if (claims.expiresAt().isBefore(now) || tokenBlacklist.isBlacklisted(claims.tokenId())) {
      return Optional.empty();
    }
    AuthSession session = sessions.findById(claims.sessionId()).orElse(null);
    if (session == null || !session.isActive(now) || !claims.tokenId().equals(session.getTokenId())) {
      return Optional.empty();
    }
    session.setLastSeenAt(now);
    sessions.save(session);
    return Optional.of(new UserPrincipal(
        claims.userId(),
        claims.email(),
        claims.name(),
        claims.role(),
        claims.sessionId(),
        claims.tokenId()
    ));
  }

  public void logout(UserPrincipal principal) {
    Instant now = Instant.now();
    sessions.findById(principal.sessionId()).ifPresent(session -> {
      session.setRevokedAt(now);
      sessions.save(session);

      tokenBlacklist.blacklist(principal.tokenId(), principal.sessionId(), principal.id(), session.getExpiresAt(), "logout");
    });
  }

  private Map<String, Object> issue(User user) {
    String sessionId = UUID.randomUUID().toString();
    String tokenId = UUID.randomUUID().toString();
    Instant expiresAt = jwtService.expiresAt();

    AuthSession session = new AuthSession();
    session.setId(sessionId);
    session.setUserId(user.getId());
    session.setTokenId(tokenId);
    session.setExpiresAt(expiresAt);
    session.setLastSeenAt(Instant.now());
    sessions.save(session);

    String token = jwtService.createToken(user, sessionId, tokenId, expiresAt);
    return Map.of("token", token, "user", publicUser(user));
  }

  public static Map<String, Object> publicUser(User user) {
    return Map.of(
        "id", user.getId(),
        "_id", user.getId(),
        "name", user.getName(),
        "email", user.getEmail(),
        "role", user.getRole()
    );
  }

  private static String normalizeEmail(String email) {
    return email == null ? "" : email.trim().toLowerCase();
  }
}
