package com.klearity.guidance.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * A Career Tree item.
 *
 * Columns title / class / category / description are the fields the admin manages and the
 * filter sidebar uses. The remaining 20+ detail fields from the 150-career dataset are kept
 * in {@code detailJson} and served on the career detail page.
 */
@Entity
@Table(name = "career_items", indexes = {
        @Index(name = "idx_career_items_class", columnList = "class_id"),
        @Index(name = "idx_career_items_category", columnList = "category"),
        @Index(name = "idx_career_items_title", columnList = "title"),
        @Index(name = "idx_career_items_active", columnList = "active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareerItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "class_id", nullable = false)
    private CareerClass careerClass;

    @Column(name = "category", nullable = false, length = 120)
    private String category;

    @Column(name = "category_code", length = 10)
    private String categoryCode;

    @Column(name = "description", nullable = false, length = 2000)
    private String description;

    @Column(name = "slug", length = 200)
    private String slug;

    /** Source id from the seed dataset, used to keep re-seeding idempotent. */
    @Column(name = "external_ref", length = 60)
    private String externalRef;

    @Column(name = "stream", length = 400)
    private String stream;

    @Column(name = "duration", length = 200)
    private String duration;

    @Column(name = "difficulty", length = 60)
    private String difficulty;

    @Column(name = "work_style", length = 200)
    private String workStyle;

    /** Comma separated interest tags derived from the seed data. */
    @Column(name = "interest_tags", length = 500)
    private String interestTags;

    /** Full detail record from the dataset, stored as JSON text. */
    @Column(name = "detail_json", columnDefinition = "text")
    private String detailJson;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;

    /** True when the row came from the built-in 150-item seed. */
    @Column(name = "seeded", nullable = false)
    @Builder.Default
    private boolean seeded = false;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
