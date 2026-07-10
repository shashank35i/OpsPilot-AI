package ai.opspilot.security;

import ai.opspilot.config.AppProperties;
import ai.opspilot.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private final AppProperties properties;
  private final SecretKey key;

  public JwtService(AppProperties properties) {
    this.properties = properties;
    this.key = keyFrom(properties.getJwtSecret());
  }

  public String createToken(User user, String sessionId, String tokenId, Instant expiresAt) {
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(user.getId())
        .id(tokenId)
        .claim("id", user.getId())
        .claim("email", user.getEmail())
        .claim("name", user.getName())
        .claim("role", user.getRole())
        .claim("sid", sessionId)
        .issuedAt(Date.from(now))
        .expiration(Date.from(expiresAt))
        .signWith(key)
        .compact();
  }

  public JwtClaims parse(String token) {
    Claims claims = Jwts.parser()
        .verifyWith(key)
        .build()
        .parseSignedClaims(token)
        .getPayload();
    return new JwtClaims(
        stringClaim(claims, "id", claims.getSubject()),
        stringClaim(claims, "email", ""),
        stringClaim(claims, "name", ""),
        stringClaim(claims, "role", "Agent"),
        stringClaim(claims, "sid", ""),
        claims.getId(),
        claims.getExpiration().toInstant()
    );
  }

  public Instant expiresAt() {
    return Instant.now().plus(properties.jwtTtl());
  }

  private static String stringClaim(Claims claims, String key, String fallback) {
    Object value = claims.get(key);
    return value == null ? fallback : String.valueOf(value);
  }

  private static SecretKey keyFrom(String secret) {
    try {
      byte[] digest = MessageDigest.getInstance("SHA-256")
          .digest((secret == null ? "" : secret).getBytes(StandardCharsets.UTF_8));
      return new SecretKeySpec(digest, "HmacSHA256");
    } catch (Exception e) {
      throw new IllegalStateException("Unable to initialize JWT signing key", e);
    }
  }
}
