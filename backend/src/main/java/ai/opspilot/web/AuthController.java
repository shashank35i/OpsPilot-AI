package ai.opspilot.web;

import ai.opspilot.model.User;
import ai.opspilot.repo.UserRepository;
import ai.opspilot.security.AuthService;
import ai.opspilot.security.UserPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthService authService;
  private final UserRepository users;

  public AuthController(AuthService authService, UserRepository users) {
    this.authService = authService;
    this.users = users;
  }

  @PostMapping("/register")
  Map<String, Object> register(@Valid @RequestBody RegisterRequest request) {
    validatePublicRole(request.role());
    return authService.register(request.name(), request.email(), request.password(), "Reporter");
  }

  @PostMapping("/login")
  Map<String, Object> login(@Valid @RequestBody LoginRequest request) {
    return authService.login(request.email(), request.password());
  }

  @PostMapping("/logout")
  Map<String, Object> logout(@AuthenticationPrincipal UserPrincipal principal) {
    authService.logout(principal);
    return Map.of("ok", true);
  }

  @GetMapping("/me")
  Map<String, Object> me(@AuthenticationPrincipal UserPrincipal principal) {
    User user = users.findById(principal.id()).orElseThrow(() -> new IllegalArgumentException("User not found"));
    return Map.of("user", AuthService.publicUser(user));
  }

  private static void validatePublicRole(String role) {
    if (role != null && !role.isBlank() && !"Reporter".equals(role)) {
      throw new IllegalArgumentException("Public registration is limited to Reporter users");
    }
  }

  record RegisterRequest(
      @NotBlank @Size(min = 2) String name,
      @NotBlank @Email String email,
      @NotBlank @Size(min = 6) String password,
      String role
  ) {}

  record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
}
