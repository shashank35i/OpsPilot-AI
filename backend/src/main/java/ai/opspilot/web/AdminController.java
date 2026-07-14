package ai.opspilot.web;

import ai.opspilot.model.SlaPolicy;
import ai.opspilot.security.RoleGuard;
import ai.opspilot.security.UserPrincipal;
import ai.opspilot.service.SlaPolicyService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
  private final SlaPolicyService slaPolicies;
  private final RoleGuard roles;

  public AdminController(SlaPolicyService slaPolicies, RoleGuard roles) {
    this.slaPolicies = slaPolicies;
    this.roles = roles;
  }

  @GetMapping("/sla-policies")
  Map<String, Object> policies(@AuthenticationPrincipal UserPrincipal user) {
    roles.requireAdmin(user);
    return Map.of("items", slaPolicies.all());
  }

  @PutMapping("/sla-policies")
  Map<String, Object> upsertPolicy(@AuthenticationPrincipal UserPrincipal user, @Valid @RequestBody SlaPolicyRequest request) {
    roles.requireAdmin(user);
    SlaPolicy policy = slaPolicies.upsert(request.severity(), request.thresholdMinutes());
    return Map.of("item", policy);
  }

  record SlaPolicyRequest(@NotBlank String severity, @Min(1) int thresholdMinutes) {}
}
