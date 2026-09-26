package com.klearity.guidance.controller;

import com.klearity.guidance.dto.OnboardingDtos;
import com.klearity.guidance.service.OnboardingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingService onboardingService;

    /** The questions a student must answer on first login. */
    @GetMapping("/questions")
    public List<OnboardingDtos.QuestionResponse> questions() {
        return onboardingService.activeQuestions();
    }

    @GetMapping("/my-answers")
    public List<OnboardingDtos.MyAnswerResponse> myAnswers() {
        return onboardingService.myAnswers();
    }

    @PostMapping("/submit")
    public Map<String, Object> submit(@Valid @RequestBody OnboardingDtos.SubmitRequest request) {
        onboardingService.submit(request.answers());
        return Map.of("completed", true, "message", "Profile completed. Welcome to your dashboard!");
    }
}
