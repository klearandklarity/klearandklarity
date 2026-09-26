package com.klearity.guidance.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * An onboarding question created and managed by the admin.
 */
@Entity
@Table(name = "onboarding_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "question_text", nullable = false, length = 500)
    private String questionText;

    @Column(name = "description", length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "answer_type", nullable = false, length = 30)
    private AnswerType answerType;

    @Builder.Default
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true,
            fetch = FetchType.EAGER)
    @OrderBy("sortOrder ASC, id ASC")
    private List<OnboardingQuestionOption> options = new ArrayList<>();

    /**
     * When true a choice question shows an extra "Other" choice and reveals a text box,
     * so the student can type their own answer. This is what powers "Others" on the Class question.
     */
    @Column(name = "allow_other", nullable = false)
    @Builder.Default
    private boolean allowOther = false;

    @Column(name = "other_label", length = 120)
    private String otherLabel;

    @Column(name = "other_placeholder", length = 300)
    private String otherPlaceholder;

    @Column(name = "required", nullable = false)
    @Builder.Default
    private boolean required = true;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;

    /** True for the two questions shipped with the app. */
    @Column(name = "system_question", nullable = false)
    @Builder.Default
    private boolean systemQuestion = false;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private java.time.Instant createdAt = java.time.Instant.now();
}
