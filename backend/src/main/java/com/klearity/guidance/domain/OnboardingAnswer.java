package com.klearity.guidance.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * A student's answer to an onboarding question.
 * The question text is snapshotted so the admin always sees what was actually asked.
 */
@Entity
@Table(name = "onboarding_answers", indexes = {
        @Index(name = "idx_answers_user", columnList = "user_id"),
        @Index(name = "idx_answers_question", columnList = "question_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private OnboardingQuestion question;

    @Column(name = "question_text_snapshot", nullable = false, length = 500)
    private String questionTextSnapshot;

    @Enumerated(EnumType.STRING)
    @Column(name = "answer_type", nullable = false, length = 30)
    private AnswerType answerType;

    /** Free text answer (text questions, or the "Other" text box). */
    @Column(name = "answer_text", length = 4000)
    private String answerText;

    /** Comma separated selected option texts. */
    @Column(name = "selected_options", length = 2000)
    private String selectedOptions;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
