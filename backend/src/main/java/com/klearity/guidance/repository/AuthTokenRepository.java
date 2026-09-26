package com.klearity.guidance.repository;

import com.klearity.guidance.domain.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AuthTokenRepository extends JpaRepository<AuthToken, Long> {

    Optional<AuthToken> findByToken(String token);

    void deleteByUserIdAndPurpose(Long userId, AuthToken.Purpose purpose);
}
