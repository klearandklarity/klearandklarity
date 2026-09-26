package com.klearity.guidance.repository;

import com.klearity.guidance.domain.OnboardingQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OnboardingQuestionRepository extends JpaRepository<OnboardingQuestion, Long> {

    List<OnboardingQuestion> findByActiveTrueOrderBySortOrderAscIdAsc();

    List<OnboardingQuestion> findAllByOrderBySortOrderAscIdAsc();

    long countByActiveTrue();
}
