package com.klearity.guidance.dto;

import com.klearity.guidance.domain.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AuthDtos() {

    public record RegisterRequest(
            @NotBlank(message = "Name is required")
            @Size(min = 2, max = 120, message = "Name must be between 2 and 120 characters")
            String fullName,

            @NotBlank(message = "Contact number is required")
            @Pattern(regexp = "^[0-9]{10}$", message = "Contact number must be exactly 10 digits")
            String contactNumber,

            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            @Size(max = 190)
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
                    message = "Password must contain at least one letter and one number")
            String password,

            @NotNull(message = "Gender is required")
            Gender gender
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "Email is required") String email,
            @NotBlank(message = "Password is required") String password
    ) {
    }

    public record ForgotPasswordRequest(
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email address") String email
    ) {
    }

    public record ResetPasswordRequest(
            @NotBlank String token,
            @NotBlank @Size(min = 8, max = 72) String newPassword
    ) {
    }

    public record ChangePasswordRequest(
            @NotBlank(message = "Current password is required") String currentPassword,
            @NotBlank @Size(min = 8, max = 72) String newPassword
    ) {
    }

    /** Returned after register / verify / reset. Never contains a usable token. */
    public record MessageResponse(String message, String email, boolean verificationRequired) {
    }

    public record AuthResponse(String token, UserDtos.MeResponse user) {
    }
}
