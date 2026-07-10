package ai.opspilot.security;

import java.time.Instant;

public record JwtClaims(
    String userId,
    String email,
    String name,
    String role,
    String sessionId,
    String tokenId,
    Instant expiresAt
) {
}
