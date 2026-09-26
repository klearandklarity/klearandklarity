package com.klearity.guidance.service;

import com.klearity.guidance.domain.Role;
import com.klearity.guidance.domain.User;
import com.klearity.guidance.exception.NotFoundException;
import com.klearity.guidance.exception.UnauthorizedException;
import com.klearity.guidance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CurrentUser {

    private final UserRepository userRepository;

    public User require() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User user)) {
            throw new UnauthorizedException("Please log in to continue.");
        }
        return user;
    }

    public User requireAdmin() {
        User user = require();
        if (user.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("You do not have permission to do that.");
        }
        return user;
    }

    public Long id() {
        return require().getId();
    }

    /**
     * The User held in the security context is detached (it was loaded by the JWT filter
     * outside this transaction). Always use this when the current user needs to be
     * modified, so the change is tracked and saved properly.
     */
    public User fresh() {
        User user = require();
        return userRepository.findById(user.getId())
                .orElseThrow(() -> new NotFoundException("Your account no longer exists."));
    }
}
