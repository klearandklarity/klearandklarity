package com.klearity.guidance.dto;

import com.klearity.guidance.domain.Gender;
import com.klearity.guidance.domain.Role;

import java.time.Instant;

public record UserDtos() {

    /**
     * What the signed-in user sees about themselves. Full name, contact and email are
     * included because it is their own account.
     */
    public record MeResponse(
            Long id,
            String fullName,
            String firstName,
            String contactNumber,
            String email,
            Gender gender,
            Role role,
            boolean emailVerified,
            boolean onboardingCompleted,
            boolean mustChangePassword,
            Instant createdAt
    ) {
    }

    /** What the admin sees in the registrations table. */
    public record AdminUserResponse(
            Long id,
            String fullName,
            String firstName,
            String contactNumber,
            String email,
            Gender gender,
            Role role,
            boolean emailVerified,
            boolean onboardingCompleted,
            boolean enabled,
            Instant createdAt
    ) {
    }

    public record UpdateProfileRequest(
            String fullName,
            String contactNumber,
            Gender gender
    ) {
    }
}
