package com.klearity.guidance.repository;

import com.klearity.guidance.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByContactNumber(String contactNumber);

    List<User> findByRoleOrderByCreatedAtDesc(com.klearity.guidance.domain.Role role);

    long countByRole(com.klearity.guidance.domain.Role role);

    long countByOnboardingCompletedTrue();

    long countByEmailVerifiedTrue();
}
