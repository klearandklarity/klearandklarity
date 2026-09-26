package com.klearity.guidance.controller;

import com.klearity.guidance.dto.AuthDtos;
import com.klearity.guidance.dto.UserDtos;
import com.klearity.guidance.service.AuthService;
import com.klearity.guidance.service.OnboardingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OnboardingService onboardingService;

    /** Creates the account. Never auto-logs-in: the client shows a popup and sends the user to Login. */
    @PostMapping("/register")
    public ResponseEntity<AuthDtos.MessageResponse> register(@Valid @RequestBody AuthDtos.RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/verify-email")
    public AuthDtos.MessageResponse verifyEmail(@RequestParam String token) {
        return authService.verifyEmail(token);
    }

    @PostMapping("/resend-verification")
    public AuthDtos.MessageResponse resendVerification(@RequestBody java.util.Map<String, String> body) {
        return authService.resendVerification(body.get("email"));
    }

    @PostMapping("/forgot-password")
    public AuthDtos.MessageResponse forgotPassword(@Valid @RequestBody AuthDtos.ForgotPasswordRequest request) {
        return authService.forgotPassword(request);
    }

    @PostMapping("/reset-password")
    public AuthDtos.MessageResponse resetPassword(@Valid @RequestBody AuthDtos.ResetPasswordRequest request) {
        return authService.resetPassword(request);
    }

    @GetMapping("/me")
    public UserDtos.MeResponse me() {
        return authService.me();
    }

    @PutMapping("/profile")
    public UserDtos.MeResponse updateProfile(@RequestBody UserDtos.UpdateProfileRequest request) {
        return authService.updateProfile(request);
    }

    @PutMapping("/change-password")
    public AuthDtos.MessageResponse changePassword(@Valid @RequestBody AuthDtos.ChangePasswordRequest request) {
        return authService.changePassword(request);
    }

    /** Drives the "Complete your profile" gate after the very first login. */
    @GetMapping("/needs-onboarding")
    public java.util.Map<String, Boolean> needsOnboarding() {
        return java.util.Map.of("required", onboardingService.needsOnboarding());
    }
}
