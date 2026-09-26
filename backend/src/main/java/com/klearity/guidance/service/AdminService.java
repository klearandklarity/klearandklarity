package com.klearity.guidance.service;

import com.klearity.guidance.domain.OnboardingAnswer;
import com.klearity.guidance.domain.PasswordResetRequest;
import com.klearity.guidance.domain.Role;
import com.klearity.guidance.domain.User;
import com.klearity.guidance.dto.OnboardingDtos;
import com.klearity.guidance.dto.PublicDtos;
import com.klearity.guidance.dto.UserDtos;
import com.klearity.guidance.exception.BadRequestException;
import com.klearity.guidance.exception.ConflictException;
import com.klearity.guidance.exception.NotFoundException;
import com.klearity.guidance.repository.CareerItemRepository;
import com.klearity.guidance.repository.DiscussionPostRepository;
import com.klearity.guidance.repository.OnboardingAnswerRepository;
import com.klearity.guidance.repository.PasswordResetRequestRepository;
import com.klearity.guidance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final OnboardingAnswerRepository answerRepository;
    private final CareerItemRepository careerItemRepository;
    private final DiscussionPostRepository postRepository;
    private final PasswordResetRequestRepository resetRequestRepository;
    private final ContactService contactService;
    private final AuthService authService;
    private final CurrentUser currentUser;

    // ---------------------------------------------------------------------- stats

    @Transactional(readOnly = true)
    public PublicDtos.AdminStatsResponse stats() {
        return new PublicDtos.AdminStatsResponse(
                userRepository.count(),
                userRepository.countByRole(Role.STUDENT),
                userRepository.countByRole(Role.EMPLOYEE),
                userRepository.countByRole(Role.ADMIN),
                userRepository.countByEmailVerifiedTrue(),
                userRepository.countByOnboardingCompletedTrue(),
                careerItemRepository.countByActiveTrue(),
                postRepository.countByDeletedFalse(),
                contactService.unreadCount(),
                resetRequestRepository.findByStatusOrderByCreatedAtDesc(
                        PasswordResetRequest.Status.PENDING).size());
    }

    // -------------------------------------------------------------- registrations

    /** Every registration, with optional search and role filter. */
    @Transactional(readOnly = true)
    public List<UserDtos.AdminUserResponse> registrations(String search, String role) {
        Specification<User> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> where = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String term = "%" + search.trim().toLowerCase(Locale.ROOT) + "%";
                where.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), term),
                        cb.like(cb.lower(root.get("email")), term),
                        cb.like(cb.lower(root.get("contactNumber")), term)));
            }
            if (role != null && !role.isBlank() && !"ALL".equalsIgnoreCase(role)) {
                try {
                    where.add(cb.equal(root.get("role"), Role.valueOf(role.toUpperCase(Locale.ROOT))));
                } catch (IllegalArgumentException ignored) {
                    // unknown role filter -> ignore
                }
            }
            return where.isEmpty() ? cb.conjunction() : cb.and(where.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        return userRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(AdminService::toAdminResponse)
                .toList();
    }

    /** The full onboarding answer set for one user, for the admin to review. */
    @Transactional(readOnly = true)
    public Map<String, Object> userAnswers(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found."));
        List<OnboardingAnswer> answers = answerRepository.findByUserIdOrderByIdAsc(userId);
        return Map.of(
                "user", toAdminResponse(user),
                "answers", answers.stream().map(AdminService::toAnswerMap).toList());
    }

    // ---------------------------------------------------------------- user manage

    @Transactional
    public UserDtos.AdminUserResponse setEnabled(Long userId, boolean enabled) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found."));
        if (target.getId().equals(currentUser.id())) {
            throw new BadRequestException("You cannot disable your own account.");
        }
        if (target.getRole() == Role.ADMIN && !enabled) {
            throw new BadRequestException("The last admin account cannot be disabled.");
        }
        target.setEnabled(enabled);
        return toAdminResponse(userRepository.save(target));
    }

    @Transactional
    public UserDtos.AdminUserResponse setRole(Long userId, Role role) {
        if (role == null) throw new BadRequestException("Please choose a role.");
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found."));

        if (target.getId().equals(currentUser.id()) && role != Role.ADMIN) {
            throw new BadRequestException("You cannot remove your own admin access.");
        }
        if (target.getRole() == Role.ADMIN && role != Role.ADMIN
                && userRepository.countByRole(Role.ADMIN) <= 1) {
            throw new BadRequestException("There must always be at least one admin.");
        }

        target.setRole(role);
        return toAdminResponse(userRepository.save(target));
    }

    @Transactional
    public void deleteUser(Long userId) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found."));
        if (target.getId().equals(currentUser.id())) {
            throw new BadRequestException("You cannot delete your own account.");
        }
        if (target.getRole() == Role.ADMIN && userRepository.countByRole(Role.ADMIN) <= 1) {
            throw new BadRequestException("There must always be at least one admin.");
        }
        answerRepository.deleteByUserId(userId);
        userRepository.delete(target);
    }

    @Transactional
    public void markEmailVerified(Long userId) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found."));
        target.setEmailVerified(true);
        userRepository.save(target);
    }

    // -------------------------------------------------- password reset fallbacks

    @Transactional(readOnly = true)
    public List<Map<String, Object>> pendingPasswordResets() {
        currentUser.requireAdmin();
        return resetRequestRepository
                .findByStatusOrderByCreatedAtDesc(PasswordResetRequest.Status.PENDING).stream()
                .map(req -> {
                    User u = req.getUser();
                    Map<String, Object> row = new java.util.LinkedHashMap<>();
                    row.put("requestId", req.getId());
                    row.put("userId", u.getId());
                    row.put("name", u.getFullName());
                    row.put("email", u.getEmail());
                    row.put("createdAt", req.getCreatedAt());
                    return row;
                })
                .toList();
    }

    @Transactional
    public void resolvePasswordReset(Long userId, String newPassword) {
        currentUser.requireAdmin();
        if (newPassword == null || newPassword.length() < 8) {
            throw new BadRequestException("The new password must be at least 8 characters.");
        }
        authService.adminSetPassword(userId, newPassword);
    }

    // -------------------------------------------------------------------- helpers

    private static Map<String, Object> toAnswerMap(OnboardingAnswer a) {
        Map<String, Object> map = new java.util.LinkedHashMap<>();
        map.put("id", a.getId());
        map.put("questionId", a.getQuestion().getId());
        map.put("question", a.getQuestionTextSnapshot());
        map.put("answerType", a.getAnswerType().name());
        map.put("text", a.getAnswerText());
        map.put("options", a.getSelectedOptions() == null
                ? List.of() : List.of(a.getSelectedOptions().split("\\|")));
        map.put("createdAt", a.getCreatedAt());
        return map;
    }

    public static UserDtos.AdminUserResponse toAdminResponse(User u) {
        return new UserDtos.AdminUserResponse(
                u.getId(), u.getFullName(), u.getFirstName(), u.getContactNumber(),
                u.getEmail(), u.getGender(), u.getRole(), u.isEmailVerified(),
                u.isOnboardingCompleted(), u.isEnabled(), u.getCreatedAt());
    }
}
