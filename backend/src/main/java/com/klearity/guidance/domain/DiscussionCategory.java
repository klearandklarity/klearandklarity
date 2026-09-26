package com.klearity.guidance.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Discussion category. Created and ordered by the admin; drives the discussion filter.
 */
@Entity
@Table(name = "discussion_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiscussionCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100, unique = true)
    private String name;

    @Column(name = "description", length = 400)
    private String description;

    /** Tailwind-ish accent key the frontend maps to a colour, e.g. "blue", "emerald". */
    @Column(name = "color", length = 30)
    private String color;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
