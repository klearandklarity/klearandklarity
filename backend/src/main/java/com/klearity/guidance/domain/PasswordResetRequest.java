package com.klearity.guidance.domain;

import jakarta.persistence.*;
import lombok.*;

/**
 * Fallback path for password resets when SMTP is not configured: the student raises a
 * request and the admin sets a new password from the admin panel.
 */
@Entity
@Table(name = "password_reset_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetRequest {

    public enum Status {
        PENDING,
        COMPLETED,
        CANCELLED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(name = "resolved_by", length = 190)
    private String resolvedBy;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private java.time.Instant createdAt = java.time.Instant.now();
}
