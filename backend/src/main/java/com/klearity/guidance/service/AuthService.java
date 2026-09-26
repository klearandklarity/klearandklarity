package com.klearity.guidance.service;

import com.klearity.guidance.domain.AuthToken;
import com.klearity.guidance.domain.PasswordResetRequest;
import com.klearity.guidance.domain.Role;
import com.klearity.guidance.domain.User;
import com.klearity.guidance.dto.AuthDtos;
import com.klearity.guidance.dto.UserDtos;
import com.klearity.guidance.exception.BadRequestException;
import com.klearity.guidance.exception.ConflictException;
import com.klearity.guidance.exception.NotFoundException;
import com.klearity.guidance.exception.UnauthorizedException;
import com.klearity.guidance.repository.AuthTokenRepository;
import com.klearity.guidance.repository.PasswordResetRequestRepository;
import com.klearity.guidance.repository.UserRepository;
import com.klearity.guidance.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final AuthTokenRepository authTokenRepository;
    private final PasswordResetRequestRepository resetRequestRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
private final MailService mailService;
private final CurrentUser currentUser;
private final Environment environment;

    // ------------------------------------------------------------------ register

    /**
     * Creates the account and returns a message for the "account created" popup.
     * Deliberately does NOT issue a token: the user must log in manually afterwards.
     */
    @Transactional
    public AuthDtos.MessageResponse register(AuthDtos.RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("An account with this email already exists. Please log in instead.");
        }
        if (userRepository.existsByContactNumber(request.contactNumber())) {
            throw new ConflictException("An account with this contact number already exists.");
        }

        User user = User.builder()
                .fullName(request.fullName().trim())
                .firstName(firstNameOf(request.fullName()))
                .contactNumber(request.contactNumber())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .gender(request.gender())
                .role(Role.STUDENT)
                .emailVerified(false)
                .onboardingCompleted(false)
                .mustChangePassword(false)
                .enabled(true)
                .build();

        userRepository.save(user);

        boolean sent = issueVerification(user);
        boolean required = verificationRequired();

        if (!sent && required) {
            throw new BadRequestException(
                    "Account created but we could not send the verification email. "
                            + "Please use 'Resend verification' on the login page.");
        }

        return new AuthDtos.MessageResponse(
                "Account created successfully. Please log in to continue.",
                email,
                required);
    }

    // --------------------------------------------------------------------- login

    @Transactional(readOnly = true)
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new UnauthorizedException("Incorrect email or password."));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Incorrect email or password.");
        }
        if (!user.isEnabled()) {
            throw new UnauthorizedException("This account has been disabled. Please contact the admin.");
        }
        if (!user.isEmailVerified() && verificationRequired()) {
            throw new UnauthorizedException(
                    "Please verify your email address first. Use 'Resend verification' below the login form.");
        }
        return new AuthDtos.AuthResponse(jwtService.generate(user), toMe(user));
    }

    // --------------------------------------------------------- email verification

    @Transactional
    public AuthDtos.MessageResponse verifyEmail(String token) {
        AuthToken authToken = authTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("This verification link is not valid."));

        if (authToken.getPurpose() != AuthToken.Purpose.EMAIL_VERIFICATION) {
            throw new BadRequestException("This verification link is not valid.");
        }
        if (!authToken.isValid()) {
            throw new BadRequestException("This verification link has expired. Please request a new one.");
        }

        User user = authToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
        authToken.setUsed(true);
        authTokenRepository.save(authToken);

        return new AuthDtos.MessageResponse("Email verified. You can now log in.", user.getEmail(), verificationRequired());
    }

    @Transactional
    public AuthDtos.MessageResponse resendVerification(String email) {
        User user = userRepository.findByEmailIgnoreCase(email == null ? "" : email.trim())
                .orElseThrow(() -> new NotFoundException("We could not find an account with that email."));

        if (user.isEmailVerified()) {
            return new AuthDtos.MessageResponse("This email is already verified. Please log in.",
                    user.getEmail(), verificationRequired());
        }

        issueVerification(user);
        return new AuthDtos.MessageResponse(
                "A new verification link has been sent. Please check your inbox.",
                user.getEmail(), verificationRequired());
    }

    // ------------------------------------------------------------- forgot password

    /**
     * Always returns the same generic message so the form cannot be used to discover which
     * emails are registered. A pending admin request is created as a fallback.
     */
    @Transactional
    public AuthDtos.MessageResponse forgotPassword(AuthDtos.ForgotPasswordRequest request) {
        String generic = "If an account exists for that email, a password reset link has been sent.";

        userRepository.findByEmailIgnoreCase(request.email().trim()).ifPresent(user -> {
            authTokenRepository.deleteByUserIdAndPurpose(user.getId(), AuthToken.Purpose.PASSWORD_RESET);
            AuthToken token = createToken(user, AuthToken.Purpose.PASSWORD_RESET, 60);
            authTokenRepository.save(token);

            boolean sent = mailService.send(user.getEmail(), "Reset your password",
                    mailService.resetEmail(user.getFirstName(), mailService.resetLink(token.getToken())));

            if (!sent) {
                resetRequestRepository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                                user.getId(), PasswordResetRequest.Status.PENDING)
                        .orElseGet(() -> resetRequestRepository.save(PasswordResetRequest.builder()
                                .user(user)
                                .status(PasswordResetRequest.Status.PENDING)
                                .build()));
            }
        });

        return new AuthDtos.MessageResponse(generic, request.email().trim(), verificationRequired());
    }

    @Transactional
    public AuthDtos.MessageResponse resetPassword(AuthDtos.ResetPasswordRequest request) {
        AuthToken token = authTokenRepository.findByToken(request.token())
                .orElseThrow(() -> new BadRequestException("This reset link is not valid."));

        if (token.getPurpose() != AuthToken.Purpose.PASSWORD_RESET) {
            throw new BadRequestException("This reset link is not valid.");
        }
        if (!token.isValid()) {
            throw new BadRequestException("This reset link has expired. Please request a new one.");
        }

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);

        token.setUsed(true);
        authTokenRepository.save(token);

        // Close any admin fallback request that was raised for this account.
        resetRequestRepository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                        user.getId(), PasswordResetRequest.Status.PENDING)
                .ifPresent(open -> {
                    open.setStatus(PasswordResetRequest.Status.COMPLETED);
                    open.setResolvedBy("self-service");
                    resetRequestRepository.save(open);
                });

        return new AuthDtos.MessageResponse("Password updated. Please log in with your new password.",
                user.getEmail(), verificationRequired());
    }

    /** Admin fallback: set a new password directly for a user. */
    @Transactional
    public void adminSetPassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found."));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);

        authTokenRepository.deleteByUserIdAndPurpose(userId, AuthToken.Purpose.PASSWORD_RESET);
        resetRequestRepository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(
                        userId, PasswordResetRequest.Status.PENDING)
                .ifPresent(open -> {
                    open.setStatus(PasswordResetRequest.Status.COMPLETED);
                    open.setResolvedBy("admin");
                    resetRequestRepository.save(open);
                });
    }

    // ------------------------------------------------------------------- profile

    @Transactional
    public AuthDtos.MessageResponse changePassword(AuthDtos.ChangePasswordRequest request) {
        User user = currentUser.fresh();
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Your current password is not correct.");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new BadRequestException("The new password must be different from the current one.");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);
        return new AuthDtos.MessageResponse("Password updated.", user.getEmail(), verificationRequired());
    }

    @Transactional
    public UserDtos.MeResponse updateProfile(UserDtos.UpdateProfileRequest request) {
        User user = currentUser.fresh();

        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
            user.setFirstName(firstNameOf(request.fullName()));
        }
        if (request.contactNumber() != null && !request.contactNumber().isBlank()) {
            String number = request.contactNumber().trim();
            if (!number.equals(user.getContactNumber())
                    && userRepository.existsByContactNumber(number)) {
                throw new ConflictException("That contact number is already used by another account.");
            }
            user.setContactNumber(number);
        }
        if (request.gender() != null) {
            user.setGender(request.gender());
        }
        userRepository.save(user);
        return toMe(user);
    }

    @Transactional(readOnly = true)
    public UserDtos.MeResponse me() {
        return toMe(currentUser.require());
    }

    // -------------------------------------------------------------------- helpers

    private boolean issueVerification(User user) {
        authTokenRepository.deleteByUserIdAndPurpose(user.getId(), AuthToken.Purpose.EMAIL_VERIFICATION);
        AuthToken token = createToken(user, AuthToken.Purpose.EMAIL_VERIFICATION, 24 * 60);
        authTokenRepository.save(token);

        String link = mailService.verificationLink(token.getToken());
        boolean sent = mailService.send(user.getEmail(), "Verify your email address",
                mailService.verificationEmail(user.getFirstName(), link));

        if (!sent) {
            // No SMTP configured: print the link so local testing can still complete.
            log.info("Email verification link for {}: {}", user.getEmail(), link);
        }
        return sent;
    }

    private AuthToken createToken(User user, AuthToken.Purpose purpose, long minutes) {
        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        return AuthToken.builder()
                .user(user)
                .token(Base64.getUrlEncoder().withoutPadding().encodeToString(bytes))
                .purpose(purpose)
                .expiresAt(Instant.now().plus(minutes, ChronoUnit.MINUTES))
                .used(false)
                .build();
    }

    private boolean verificationRequired() {
        // Read the resolved property so ${MAIL_VERIFICATION_REQUIRED:} in application.yml
        // picks up a real environment variable, a system property or a .env entry.
        String override = environment.getProperty("app.mail.verification-required", "");
        if (override != null && !override.isBlank()) {
            return Boolean.parseBoolean(override.trim());
        }
        // Blank means auto: verification is enforced only once real SMTP credentials
        // exist, so local development still works without a mailbox.
        return mailService.isConfigured();
    }

    public static String firstNameOf(String fullName) {
        if (fullName == null || fullName.isBlank()) return "Student";
        String cleaned = fullName.trim().replaceAll("\\s+", " ");
        int idx = cleaned.indexOf(' ');
        String first = idx > 0 ? cleaned.substring(0, idx) : cleaned;
        return first.length() > 60 ? first.substring(0, 60) : first;
    }

    public static UserDtos.MeResponse toMe(User user) {
        return new UserDtos.MeResponse(
                user.getId(), user.getFullName(), user.getFirstName(), user.getContactNumber(),
                user.getEmail(), user.getGender(), user.getRole(), user.isEmailVerified(),
                user.isOnboardingCompleted(), user.isMustChangePassword(), user.getCreatedAt());
    }
}
