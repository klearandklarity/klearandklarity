package com.klearity.guidance.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import com.klearity.guidance.config.AppProperties;
import com.klearity.guidance.domain.Role;
import com.klearity.guidance.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
@RequiredArgsConstructor
public class JwtService {

    private final AppProperties props;

    private SecretKey key() {
        byte[] bytes = props.getJwt().getSecret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(bytes);
    }

    public String generate(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + props.getJwt().getExpirationMinutes() * 60_000L);
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .claim("firstName", user.getFirstName())
                .claim("onboardingCompleted", user.isOnboardingCompleted())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key())
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key()).build()
                .parseSignedClaims(token).getPayload();
    }

    public Long extractUserId(String token) {
        return Long.valueOf(parse(token).getSubject());
    }

    public Role extractRole(String token) {
        return Role.valueOf(parse(token).get("role", String.class));
    }
}
