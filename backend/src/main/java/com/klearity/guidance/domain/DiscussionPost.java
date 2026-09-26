package com.klearity.guidance.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * A discussion post. Deliberately stores a display name string rather than exposing the
 * author relation to the API, so no profile data can leak to other students.
 */
@Entity
@Table(name = "discussion_posts", indexes = {
        @Index(name = "idx_posts_category", columnList = "category_id"),
        @Index(name = "idx_posts_created", columnList = "created_at"),
        @Index(name = "idx_posts_pinned", columnList = "pinned")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiscussionPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private DiscussionCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_user_id")
    private User author;

    /**
     * Exactly what other users see: either the author's first name, or "Anonymous".
     * Never the surname, email, phone, id or a profile link.
     */
    @Column(name = "display_name", nullable = false, length = 60)
    private String displayName;

    @Column(name = "is_anonymous", nullable = false)
    @Builder.Default
    private boolean anonymous = false;

    @Column(name = "title", nullable = false, length = 250)
    private String title;

    @Column(name = "body", nullable = false, length = 8000)
    private String body;

    @Column(name = "pinned", nullable = false)
    @Builder.Default
    private boolean pinned = false;

    @Column(name = "deleted", nullable = false)
    @Builder.Default
    private boolean deleted = false;

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
