package com.klearity.guidance.controller;

import com.klearity.guidance.dto.PublicDtos;
import com.klearity.guidance.service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final ContactService contactService;

    /** Used by the Home, About and Contact pages. */
    @GetMapping("/settings")
    public PublicDtos.SettingsResponse settings() {
        return contactService.settings();
    }

    @PostMapping("/contact")
    public Map<String, Object> contact(@Valid @RequestBody PublicDtos.ContactRequest request) {
        contactService.save(request);
        return Map.of(
                "message", "Thank you for contacting us. Our team will get back to you shortly.",
                "ok", true);
    }
}
