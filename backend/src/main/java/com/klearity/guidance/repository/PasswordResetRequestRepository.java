package com.klearity.guidance.repository;

import com.klearity.guidance.domain.PasswordResetRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PasswordResetRequestRepository extends JpaRepository<PasswordResetRequest, Long> {

    List<PasswordResetRequest> findByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<PasswordResetRequest> findFirstByUserIdAndStatusOrderByCreatedAtDesc(
            Long userId, PasswordResetRequest.Status status);

    List<PasswordResetRequest> findByStatusOrderByCreatedAtDesc(PasswordResetRequest.Status status);
}
