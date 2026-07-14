package ai.opspilot.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import ai.opspilot.model.SlaPolicy;
import ai.opspilot.repo.SlaPolicyRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class SlaPolicyServiceTest {
  @Test
  void returnsConfiguredThresholdWhenPolicyExists() {
    SlaPolicyRepository repository = mock(SlaPolicyRepository.class);
    SlaPolicy policy = new SlaPolicy();
    policy.setSeverity("High");
    policy.setThresholdMinutes(45);
    when(repository.findBySeverity("High")).thenReturn(Optional.of(policy));

    SlaPolicyService service = new SlaPolicyService(repository);

    assertThat(service.thresholdMinutesFor("High")).isEqualTo(45);
  }

  @Test
  void returnsDefaultThresholdWhenPolicyIsMissing() {
    SlaPolicyRepository repository = mock(SlaPolicyRepository.class);
    when(repository.findBySeverity("Critical")).thenReturn(Optional.empty());

    SlaPolicyService service = new SlaPolicyService(repository);

    assertThat(service.thresholdMinutesFor("Critical")).isEqualTo(15);
  }

  @Test
  void rejectsInvalidPolicyInput() {
    SlaPolicyRepository repository = mock(SlaPolicyRepository.class);
    SlaPolicyService service = new SlaPolicyService(repository);

    assertThatThrownBy(() -> service.upsert("Urgent", 0))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("Invalid SLA policy");
  }

  @Test
  void savesValidPolicyInput() {
    SlaPolicyRepository repository = mock(SlaPolicyRepository.class);
    when(repository.findBySeverity("Low")).thenReturn(Optional.empty());
    SlaPolicyService service = new SlaPolicyService(repository);

    service.upsert("Low", 1200);

    ArgumentCaptor<SlaPolicy> captor = ArgumentCaptor.forClass(SlaPolicy.class);
    verify(repository).save(captor.capture());
    assertThat(captor.getValue().getSeverity()).isEqualTo("Low");
    assertThat(captor.getValue().getThresholdMinutes()).isEqualTo(1200);
  }
}
