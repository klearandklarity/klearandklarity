package com.klearity.guidance.service;

import com.klearity.guidance.domain.ContactMessage;
import com.klearity.guidance.domain.SiteSettings;
import com.klearity.guidance.dto.PublicDtos;
import com.klearity.guidance.exception.NotFoundException;
import com.klearity.guidance.repository.ContactMessageRepository;
import com.klearity.guidance.repository.SiteSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ContactService {

    private static final long SETTINGS_ID = 1L;

    private final ContactMessageRepository messageRepository;
    private final SiteSettingsRepository settingsRepository;

    @Transactional
    public PublicDtos.ContactResponse save(PublicDtos.ContactRequest request) {
        ContactMessage saved = messageRepository.save(ContactMessage.builder()
                .name(request.name().trim())
                .email(request.email().trim().toLowerCase(Locale.ROOT))
                .subject(request.subject().trim())
                .message(request.message().trim())
                .build());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PublicDtos.ContactResponse> all() {
        return messageRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(ContactService::toResponse)
                .toList();
    }

    @Transactional
    public PublicDtos.ContactResponse markRead(Long id, boolean read) {
        ContactMessage message = messageRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Message not found."));
        message.setRead(read);
        return toResponse(messageRepository.save(message));
    }

    @Transactional
    public PublicDtos.ContactResponse updateNote(Long id, String note, Boolean replied) {
        ContactMessage message = messageRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Message not found."));
        if (note != null) {
            message.setAdminNote(note.isBlank() ? null : note.trim());
        }
        if (replied != null) {
            message.setReplied(replied);
            if (replied) message.setRead(true);
        }
        return toResponse(messageRepository.save(message));
    }

    @Transactional
    public void delete(Long id) {
        ContactMessage message = messageRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Message not found."));
        messageRepository.delete(message);
    }

    public long unreadCount() {
        return messageRepository.countByReadFalse();
    }

    // ------------------------------------------------------------------- settings

    @Transactional(readOnly = true)
    public PublicDtos.SettingsResponse settings() {
        SiteSettings s = settingsRepository.findById(SETTINGS_ID).orElse(null);
        if (s == null) {
            return new PublicDtos.SettingsResponse("Klear And Klarity",
                    "Career clarity for every student", null, null, null, null, "/logo.jpeg");
        }
        return new PublicDtos.SettingsResponse(
                s.getCompanyName(), s.getTagline(), s.getAboutText(),
                s.getContactEmail(), s.getContactPhone(), s.getAddress(), s.getLogoPath());
    }

    @Transactional
    public PublicDtos.SettingsResponse updateSettings(PublicDtos.SettingsUpdateRequest request) {
        SiteSettings s = settingsRepository.findById(SETTINGS_ID)
                .orElseGet(() -> SiteSettings.builder().id(SETTINGS_ID)
                        .companyName("Klear And Klarity").build());

        s.setCompanyName(request.companyName().trim());
        s.setTagline(request.tagline());
        s.setAboutText(request.aboutText());
        s.setContactEmail(blankToNull(request.contactEmail()));
        s.setContactPhone(blankToNull(request.contactPhone()));
        s.setAddress(blankToNull(request.address()));
        s.setLogoPath(blankToNull(request.logoPath()));
        settingsRepository.save(s);

        return new PublicDtos.SettingsResponse(
                s.getCompanyName(), s.getTagline(), s.getAboutText(),
                s.getContactEmail(), s.getContactPhone(), s.getAddress(), s.getLogoPath());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public static PublicDtos.ContactResponse toResponse(ContactMessage m) {
        return new PublicDtos.ContactResponse(
                m.getId(), m.getName(), m.getEmail(), m.getSubject(), m.getMessage(),
                m.isRead(), m.isReplied(), m.getAdminNote(), m.getCreatedAt());
    }
}
