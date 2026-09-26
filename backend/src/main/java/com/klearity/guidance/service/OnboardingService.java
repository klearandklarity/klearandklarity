package com.klearity.guidance.service;

import com.klearity.guidance.domain.AnswerType;
import com.klearity.guidance.domain.OnboardingAnswer;
import com.klearity.guidance.domain.OnboardingQuestion;
import com.klearity.guidance.domain.OnboardingQuestionOption;
import com.klearity.guidance.domain.User;
import com.klearity.guidance.dto.OnboardingDtos;
import com.klearity.guidance.exception.BadRequestException;
import com.klearity.guidance.exception.ConflictException;
import com.klearity.guidance.exception.NotFoundException;
import com.klearity.guidance.repository.OnboardingAnswerRepository;
import com.klearity.guidance.repository.OnboardingQuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OnboardingService {

    private final OnboardingQuestionRepository questionRepository;
    private final OnboardingAnswerRepository answerRepository;
    private final com.klearity.guidance.repository.UserRepository userRepository;
    private final CurrentUser currentUser;

    // ------------------------------------------------------- student facing reads

    @Transactional(readOnly = true)
    public List<OnboardingDtos.QuestionResponse> activeQuestions() {
        return questionRepository.findByActiveTrueOrderBySortOrderAscIdAsc().stream()
                .map(q -> toResponse(q, -1))
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean needsOnboarding() {
        User user = currentUser.require();
        return user.getRole() != com.klearity.guidance.domain.Role.ADMIN && !user.isOnboardingCompleted();
    }

    @Transactional(readOnly = true)
    public List<OnboardingDtos.MyAnswerResponse> myAnswers() {
        Long userId = currentUser.id();
        List<OnboardingQuestion> questions = questionRepository.findByActiveTrueOrderBySortOrderAscIdAsc();
        return answerRepository.findByUserIdOrderByIdAsc(userId).stream()
                .map(answer -> {
                    boolean hasOther = answer.getSelectedOptions() != null
                            && answer.getSelectedOptions().contains(OTHER_MARKER);
                    return new OnboardingDtos.MyAnswerResponse(
                            answer.getQuestion().getId(),
                            answer.getAnswerType(),
                            answer.getAnswerText(),
                            splitOptions(answer.getSelectedOptions()),
                            hasOther,
                            hasOther ? "Other" : null);
                })
                .filter(a -> questions.stream().anyMatch(q -> q.getId().equals(a.questionId())))
                .toList();
    }

    // ------------------------------------------------------------ student answers

    @Transactional
    public void submit(List<OnboardingDtos.AnswerRequest> answers) {
        User user = currentUser.fresh();
        List<OnboardingQuestion> questions = questionRepository.findByActiveTrueOrderBySortOrderAscIdAsc();

        if (questions.isEmpty()) {
            user.setOnboardingCompleted(true);
            userRepository.save(user);
            return;
        }

        Set<Long> requiredIds = questions.stream()
                .filter(OnboardingQuestion::isRequired)
                .map(OnboardingQuestion::getId)
                .collect(Collectors.toCollection(HashSet::new));

        // Validate everything before writing anything.
        for (OnboardingDtos.AnswerRequest answer : answers) {
            OnboardingQuestion question = questions.stream()
                    .filter(q -> q.getId().equals(answer.questionId()))
                    .findFirst()
                    .orElseThrow(() -> new BadRequestException("Unknown question in your answers."));

            requiredIds.remove(question.getId());
            validate(question, answer);
        }

        if (!requiredIds.isEmpty()) {
            throw new BadRequestException("Please answer all the required questions.");
        }

        answerRepository.deleteByUserId(user.getId());
        answerRepository.flush();

        for (OnboardingDtos.AnswerRequest answer : answers) {
            OnboardingQuestion question = questions.stream()
                    .filter(q -> q.getId().equals(answer.questionId()))
                    .findFirst()
                    .orElseThrow(() -> new BadRequestException("Unknown question in your answers."));

            String selected = null;
            if (answer.options() != null && !answer.options().isEmpty()) {
                selected = String.join("|", answer.options());
            } else if (question.isAllowOther() && answer.text() != null && !answer.text().isBlank()) {
                selected = OTHER_MARKER;
            }

            answerRepository.save(OnboardingAnswer.builder()
                    .user(user)
                    .question(question)
                    .questionTextSnapshot(question.getQuestionText())
                    .answerType(question.getAnswerType())
                    .answerText(answer.text() == null ? null : answer.text().trim())
                    .selectedOptions(selected)
                    .build());
        }

        user.setOnboardingCompleted(true);
        userRepository.save(user);
    }

    private void validate(OnboardingQuestion question, OnboardingDtos.AnswerRequest answer) {
        boolean hasText = answer.text() != null && !answer.text().isBlank();
        List<String> options = answer.options() == null ? List.of() : answer.options()
                .stream().filter(o -> o != null && !o.isBlank()).toList();

        if (!hasText && options.isEmpty()) {
            if (question.isRequired()) {
                throw new BadRequestException("Please answer: \"" + question.getQuestionText() + "\"");
            }
            return;
        }

        switch (question.getAnswerType()) {
            case SHORT_TEXT, LONG_TEXT -> {
                if (!hasText) {
                    throw new BadRequestException("Please answer: \"" + question.getQuestionText() + "\"");
                }
                if (question.getAnswerType() == AnswerType.SHORT_TEXT && answer.text().trim().length() > 200) {
                    throw new BadRequestException("Please keep your answer under 200 characters.");
                }
            }
            case SINGLE_CHOICE -> {
                if (options.size() > 1) {
                    throw new BadRequestException("Please choose only one option for: \""
                            + question.getQuestionText() + "\"");
                }
                if (!options.isEmpty() && !question.isAllowOther()) {
                    requireKnownOption(question, options.get(0));
                }
            }
            case MULTI_CHOICE -> {
                if (question.isAllowOther() && options.size() > 1
                        && options.contains(OTHER_MARKER) && !hasText) {
                    throw new BadRequestException("Please type your answer in the 'Other' box.");
                }
                options.stream()
                        .filter(o -> !OTHER_MARKER.equals(o))
                        .forEach(o -> requireKnownOption(question, o));
            }
        }
    }

    private void requireKnownOption(OnboardingQuestion question, String selected) {
        boolean known = question.getOptions().stream()
                .anyMatch(o -> o.getOptionText().equalsIgnoreCase(selected.trim()));
        if (!known) {
            throw new BadRequestException("'" + selected + "' is not a valid option for: \""
                    + question.getQuestionText() + "\"");
        }
    }

    // ------------------------------------------------------------- admin manages

    @Transactional(readOnly = true)
    public List<OnboardingDtos.QuestionResponse> allQuestions() {
        return questionRepository.findAllByOrderBySortOrderAscIdAsc().stream()
                .map(q -> toResponse(q, answerRepository.countByQuestionId(q.getId())))
                .toList();
    }

    @Transactional
    public OnboardingDtos.QuestionResponse create(OnboardingDtos.QuestionRequest request) {
        OnboardingQuestion question = OnboardingQuestion.builder()
                .questionText(request.questionText().trim())
                .description(blankToNull(request.description()))
                .answerType(request.answerType())
                .allowOther(request.allowOther())
                .otherLabel(blankToNull(request.otherLabel()))
                .otherPlaceholder(blankToNull(request.otherPlaceholder()))
                .required(request.required())
                .active(request.active() == null || request.active())
                .systemQuestion(false)
                .sortOrder(nextSortOrder())
                .options(new ArrayList<>())
                .build();

        applyOptions(question, request);
        questionRepository.save(question);
        return toResponse(question, 0);
    }

    @Transactional
    public OnboardingDtos.QuestionResponse update(Long id, OnboardingDtos.QuestionRequest request) {
        OnboardingQuestion question = questionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Question not found."));

        question.setQuestionText(request.questionText().trim());
        question.setDescription(blankToNull(request.description()));
        question.setAnswerType(request.answerType());
        question.setAllowOther(request.allowOther());
        question.setOtherLabel(blankToNull(request.otherLabel()));
        question.setOtherPlaceholder(blankToNull(request.otherPlaceholder()));
        question.setRequired(request.required());
        if (request.active() != null) question.setActive(request.active());

        applyOptions(question, request);
        questionRepository.save(question);
        return toResponse(question, answerRepository.countByQuestionId(id));
    }

    @Transactional
    public void delete(Long id) {
        OnboardingQuestion question = questionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Question not found."));
        questionRepository.delete(question);
    }

    @Transactional
    public void reorder(List<Long> orderedIds) {
        int[] order = {0};
        for (Long id : orderedIds) {
            questionRepository.findById(id).ifPresent(q -> {
                q.setSortOrder(order[0]++);
                questionRepository.save(q);
            });
        }
    }

    // -------------------------------------------------------------------- helpers

    public static final String OTHER_MARKER = "__OTHER__";

    private void applyOptions(OnboardingQuestion question, OnboardingDtos.QuestionRequest request) {
        question.getOptions().clear();

        if (request.answerType() == AnswerType.SINGLE_CHOICE || request.answerType() == AnswerType.MULTI_CHOICE) {
            List<OnboardingDtos.OptionRequest> options =
                    request.options() == null ? List.of() : request.options();

            if (!question.isAllowOther() && options.stream().noneMatch(o -> o.optionText() != null
                    && !o.optionText().isBlank())) {
                throw new BadRequestException("Please add at least one option, or turn on 'Allow Other'.");
            }

            int order = 0;
            for (OnboardingDtos.OptionRequest option : options) {
                if (option.optionText() == null || option.optionText().isBlank()) continue;
                question.getOptions().add(OnboardingQuestionOption.builder()
                        .question(question)
                        .optionText(option.optionText().trim())
                        .optionHint(blankToNull(option.optionHint()))
                        .sortOrder(order++)
                        .build());
            }
        }
    }

    private int nextSortOrder() {
        List<OnboardingQuestion> all = questionRepository.findAllByOrderBySortOrderAscIdAsc();
        return all.isEmpty() ? 0 : all.get(all.size() - 1).getSortOrder() + 1;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static List<String> splitOptions(String joined) {
        if (joined == null || joined.isBlank()) return List.of();
        return List.of(joined.split("\\|"));
    }

    public static OnboardingDtos.QuestionResponse toResponse(OnboardingQuestion q, long answerCount) {
        List<OnboardingDtos.OptionResponse> options = q.getOptions().stream()
                .map(o -> new OnboardingDtos.OptionResponse(
                        o.getId(), o.getOptionText(), o.getOptionHint(), o.getSortOrder()))
                .toList();
        return new OnboardingDtos.QuestionResponse(
                q.getId(), q.getQuestionText(), q.getDescription(), q.getAnswerType(), options,
                q.isAllowOther(), q.getOtherLabel(), q.getOtherPlaceholder(), q.isRequired(),
                q.getSortOrder(), q.isActive(), q.isSystemQuestion(), answerCount);
    }
}
