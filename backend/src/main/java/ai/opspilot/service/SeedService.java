package ai.opspilot.service;

import ai.opspilot.config.AppProperties;
import ai.opspilot.model.Activity;
import ai.opspilot.model.Incident;
import ai.opspilot.model.Task;
import ai.opspilot.model.User;
import ai.opspilot.repo.ActivityRepository;
import ai.opspilot.repo.IncidentRepository;
import ai.opspilot.repo.TaskRepository;
import ai.opspilot.repo.UserRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class SeedService implements ApplicationRunner {
  private final AppProperties properties;
  private final UserRepository users;
  private final IncidentRepository incidents;
  private final TaskRepository tasks;
  private final ActivityRepository activities;
  private final PasswordEncoder passwordEncoder;
  private final SlaPolicyService slaPolicies;

  public SeedService(
      AppProperties properties,
      UserRepository users,
      IncidentRepository incidents,
      TaskRepository tasks,
      ActivityRepository activities,
      PasswordEncoder passwordEncoder,
      SlaPolicyService slaPolicies
  ) {
    this.properties = properties;
    this.users = users;
    this.incidents = incidents;
    this.tasks = tasks;
    this.activities = activities;
    this.passwordEncoder = passwordEncoder;
    this.slaPolicies = slaPolicies;
  }

  @Override
  public void run(ApplicationArguments args) {
    slaPolicies.seedDefaults();
    if (!properties.shouldSeed() || users.findByEmail("admin@opspilot.ai").isPresent()) return;

    User admin = user("Platform Admin", "admin@opspilot.ai", "Admin@123", "Admin");
    User responder = user("Response Lead", "responder@opspilot.ai", "Responder@123", "Responder");
    User reporter = user("Service Reporter", "reporter@opspilot.ai", "Reporter@123", "Reporter");
    users.saveAll(List.of(admin, responder, reporter));

    Incident payment = incident(
        "Payment gateway latency spike",
        "Increased latency on checkout payments in US-East.",
        "High",
        "Payments",
        "Investigating",
        reporter.getId(),
        responder.getId(),
        6,
        List.of("payments", "latency")
    );
    Incident mobile = incident(
        "Mobile app crash on login",
        "Crash reports from iOS 17 users.",
        "Critical",
        "Mobile",
        "Open",
        reporter.getId(),
        responder.getId(),
        4,
        List.of("mobile", "crash")
    );
    Incident inventory = incident(
        "Inventory sync delayed",
        "Warehouse sync running 30 mins behind.",
        "Medium",
        "Inventory",
        "Mitigated",
        reporter.getId(),
        responder.getId(),
        12,
        List.of("inventory")
    );
    incidents.saveAll(List.of(payment, mobile, inventory));

    tasks.saveAll(List.of(
        task("Communicate incident update", "In Progress", "High", payment.getId()),
        task("Prepare rollback plan", "Todo", "High", mobile.getId()),
        task("Verify sync backlog", "Todo", "Medium", inventory.getId())
    ));

    Activity seed = new Activity();
    seed.setActor(admin.getId());
    seed.setType("SEED");
    seed.setEntityType("System");
    seed.setMessage("Seeded baseline data");
    activities.save(seed);
  }

  private User user(String name, String email, String password, String role) {
    User user = new User();
    user.setName(name);
    user.setEmail(email);
    user.setPasswordHash(passwordEncoder.encode(password));
    user.setRole(role);
    return user;
  }

  private Incident incident(String title, String description, String severity, String category, String status, String owner, String assignee, int slaHours, List<String> tags) {
    Incident incident = new Incident();
    incident.setTitle(title);
    incident.setDescription(description);
    incident.setSeverity(severity);
    incident.setCategory(category);
    incident.setStatus(status);
    incident.setOwner(owner);
    incident.setAssignee(assignee);
    incident.setSlaHours(slaHours);
    incident.setDueAt(Instant.now().plus(Duration.ofHours(slaHours)));
    incident.setTags(tags);
    return incident;
  }

  private Task task(String title, String status, String priority, String incidentId) {
    Task task = new Task();
    task.setTitle(title);
    task.setStatus(status);
    task.setPriority(priority);
    task.setIncident(incidentId);
    return task;
  }
}
