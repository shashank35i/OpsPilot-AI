package ai.opspilot.security;

public record UserPrincipal(String id, String email, String name, String role, String sessionId, String tokenId) {
}
