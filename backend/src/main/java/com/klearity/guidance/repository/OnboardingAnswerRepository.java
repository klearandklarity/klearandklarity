package com.klearity.guidance.repository;

import com.klearity.guidance.domain.OnboardingAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OnboardingAnswerRepository extends JpaRepository<OnboardingAnswer, Long> {

    List<OnboardingAnswer> findByUserIdOrderByIdAsc(Long userId);

    void deleteByUserId(Long userId);

    long countByQuestionId(Long questionId);
}
