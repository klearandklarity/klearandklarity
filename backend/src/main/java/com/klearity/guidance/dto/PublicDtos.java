package com.klearity.guidance.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record PublicDtos() {

    public record ContactRequest(
            @NotBlank(message = "Your name is required") @Size(min = 2, max = 120) String name,
            @NotBlank(message = "Your email is required") @Email(message = "Enter a valid email address") String email,
            @NotBlank(message = "Subject is required") @Size(min = 3, max = 200) String subject,
            @NotBlank(message = "Message is required") @Size(min = 10, max = 5000) String message
    ) {
    }

    public record ContactResponse(Long id, String name, String email, String subject, String message,
                                  boolean read, boolean replied, String adminNote, Instant createdAt) {
    }

    public record SettingsResponse(
            String companyName,
            String tagline,
            String aboutText,
            String contactEmail,
            String contactPhone,
            String address,
            String logoPath
    ) {
    }

    public record SettingsUpdateRequest(
            @NotBlank @Size(max = 120) String companyName,
            @Size(max = 250) String tagline,
            @Size(max = 8000) String aboutText,
            @Email @Size(max = 190) String contactEmail,
            @Size(max = 40) String contactPhone,
            @Size(max = 400) String address,
            @Size(max = 300) String logoPath
    ) {
    }

    public record AdminStatsResponse(
            long totalRegistrations,
            long students,
            long employees,
            long admins,
            long verifiedEmails,
            long onboardingCompleted,
            long totalCareerItems,
            long totalDiscussions,
            long unreadMessages,
            long pendingPasswordResets
    ) {
    }
}
