package com.klearity.guidance.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "onboarding_question_options")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingQuestionOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private OnboardingQuestion question;

    @Column(name = "option_text", nullable = false, length = 200)
    private String optionText;

    /** Optional admin hint shown under the option. */
    @Column(name = "option_hint", length = 300)
    private String optionHint;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;
}
