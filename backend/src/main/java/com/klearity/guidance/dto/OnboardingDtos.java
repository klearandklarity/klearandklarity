package com.klearity.guidance.dto;

import com.klearity.guidance.domain.AnswerType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record OnboardingDtos() {

    public record OptionRequest(
            @NotBlank(message = "Option text is required") @Size(max = 200) String optionText,
            @Size(max = 300) String optionHint
    ) {
    }

    public record OptionResponse(Long id, String optionText, String optionHint, int sortOrder) {
    }

    public record QuestionRequest(
            @NotBlank(message = "Question text is required") @Size(max = 500) String questionText,
            @Size(max = 500) String description,
            @NotNull(message = "Answer type is required") AnswerType answerType,
            @Valid List<OptionRequest> options,
            boolean allowOther,
            @Size(max = 120) String otherLabel,
            @Size(max = 300) String otherPlaceholder,
            boolean required,
            Boolean active
    ) {
    }

    public record QuestionResponse(
            Long id,
            String questionText,
            String description,
            AnswerType answerType,
            List<OptionResponse> options,
            boolean allowOther,
            String otherLabel,
            String otherPlaceholder,
            boolean required,
            int sortOrder,
            boolean active,
            boolean systemQuestion,
            long answerCount
    ) {
    }

    /** One answer submitted by a student. */
    public record AnswerRequest(
            @NotNull(message = "Question id is required") Long questionId,
            @Size(max = 4000) String text,
            List<String> options
    ) {
    }

    public record SubmitRequest(@NotNull @Size(min = 1, message = "Please answer the questions") List<@Valid AnswerRequest> answers) {
    }

    /** The student's own saved answers, keyed by question id. */
    public record MyAnswerResponse(
            Long questionId,
            AnswerType answerType,
            String text,
            List<String> options,
            boolean allowOther,
            String otherLabel
    ) {
    }
}
