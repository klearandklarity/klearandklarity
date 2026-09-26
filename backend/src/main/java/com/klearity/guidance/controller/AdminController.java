package com.klearity.guidance.controller;

import com.klearity.guidance.domain.Role;
import com.klearity.guidance.dto.CareerDtos;
import com.klearity.guidance.dto.DiscussionDtos;
import com.klearity.guidance.dto.OnboardingDtos;
import com.klearity.guidance.dto.PublicDtos;
import com.klearity.guidance.dto.UserDtos;
import com.klearity.guidance.service.AdminService;
import com.klearity.guidance.service.CareerService;
import com.klearity.guidance.service.ContactService;
import com.klearity.guidance.service.DiscussionService;
import com.klearity.guidance.service.OnboardingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final OnboardingService onboardingService;
    private final CareerService careerService;
    private final DiscussionService discussionService;
    private final ContactService contactService;

    // ------------------------------------------------------------------ dashboard

    @GetMapping("/stats")
    public PublicDtos.AdminStatsResponse stats() {
        return adminService.stats();
    }

    // --------------------------------------------------------------- registrations

    @GetMapping("/registrations")
    public List<UserDtos.AdminUserResponse> registrations(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role) {
        return adminService.registrations(search, role);
    }

    @GetMapping("/registrations/{id}/answers")
    public Map<String, Object> registrationAnswers(@PathVariable Long id) {
        return adminService.userAnswers(id);
    }

    @PatchMapping("/registrations/{id}/enabled")
    public UserDtos.AdminUserResponse setEnabled(@PathVariable Long id, @RequestParam boolean enabled) {
        return adminService.setEnabled(id, enabled);
    }

    @PatchMapping("/registrations/{id}/role")
    public UserDtos.AdminUserResponse setRole(@PathVariable Long id, @RequestParam Role role) {
        return adminService.setRole(id, role);
    }

    @PatchMapping("/registrations/{id}/verify-email")
    public UserDtos.AdminUserResponse verifyEmail(@PathVariable Long id) {
        adminService.markEmailVerified(id);
        return adminService.registrations(null, null).stream()
                .filter(u -> u.id().equals(id)).findFirst().orElseThrow();
    }

    @DeleteMapping("/registrations/{id}")
    public Map<String, Boolean> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return Map.of("deleted", true);
    }

    @PostMapping("/registrations/{id}/set-password")
    public Map<String, Boolean> setPassword(@PathVariable Long id,
                                            @RequestBody Map<String, String> body) {
        adminService.resolvePasswordReset(id, body.get("newPassword"));
        return Map.of("updated", true);
    }

    @GetMapping("/password-resets")
    public List<Map<String, Object>> passwordResets() {
        return adminService.pendingPasswordResets();
    }

    // ------------------------------------------------------------------ onboarding

    @GetMapping("/onboarding/questions")
    public List<OnboardingDtos.QuestionResponse> questions() {
        return onboardingService.allQuestions();
    }

    @PostMapping("/onboarding/questions")
    public OnboardingDtos.QuestionResponse createQuestion(@Valid @RequestBody OnboardingDtos.QuestionRequest request) {
        return onboardingService.create(request);
    }

    @PutMapping("/onboarding/questions/{id}")
    public OnboardingDtos.QuestionResponse updateQuestion(@PathVariable Long id,
                                                         @Valid @RequestBody OnboardingDtos.QuestionRequest request) {
        return onboardingService.update(id, request);
    }

    @DeleteMapping("/onboarding/questions/{id}")
    public Map<String, Boolean> deleteQuestion(@PathVariable Long id) {
        onboardingService.delete(id);
        return Map.of("deleted", true);
    }

    @PostMapping("/onboarding/questions/reorder")
    public Map<String, Boolean> reorderQuestions(@RequestBody Map<String, List<Long>> body) {
        onboardingService.reorder(body.getOrDefault("ids", List.of()));
        return Map.of("reordered", true);
    }

    // ----------------------------------------------------------------- career tree

    @GetMapping("/career/classes")
    public List<CareerDtos.ClassResponse> classes() {
        return careerService.classesWithCounts();
    }

    @PostMapping("/career/classes")
    public CareerDtos.ClassResponse createClass(@Valid @RequestBody CareerDtos.ClassRequest request) {
        return careerService.createClass(request);
    }

    @PutMapping("/career/classes/{id}")
    public CareerDtos.ClassResponse updateClass(@PathVariable Long id,
                                               @Valid @RequestBody CareerDtos.ClassRequest request) {
        return careerService.updateClass(id, request);
    }

    @DeleteMapping("/career/classes/{id}")
    public Map<String, Boolean> deleteClass(@PathVariable Long id) {
        careerService.deleteClass(id);
        return Map.of("deleted", true);
    }

    @GetMapping("/career/items")
    public List<CareerDtos.ItemSummary> careerItems(
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "title") String sort) {
        return careerService.listItems(classId, null, search, sort);
    }

    @PostMapping("/career/items")
    public CareerDtos.ItemSummary createItem(@Valid @RequestBody CareerDtos.ItemRequest request) {
        return careerService.createItem(request);
    }

    @PutMapping("/career/items/{id}")
    public CareerDtos.ItemSummary updateItem(@PathVariable Long id,
                                            @Valid @RequestBody CareerDtos.ItemRequest request) {
        return careerService.updateItem(id, request);
    }

    @DeleteMapping("/career/items/{id}")
    public Map<String, Boolean> deleteItem(@PathVariable Long id) {
        careerService.deleteItem(id);
        return Map.of("deleted", true);
    }

    @GetMapping("/career/items/{id}")
    public CareerDtos.ItemDetail careerItem(@PathVariable Long id) {
        return careerService.detail(id);
    }

    // ------------------------------------------------------------------ discussion

    @GetMapping("/discussion/categories")
    public List<DiscussionDtos.CategoryResponse> discussionCategories() {
        return discussionService.allCategories();
    }

    @PostMapping("/discussion/categories")
    public DiscussionDtos.CategoryResponse createCategory(@Valid @RequestBody DiscussionDtos.CategoryRequest request) {
        return discussionService.createCategory(request);
    }

    @PutMapping("/discussion/categories/{id}")
    public DiscussionDtos.CategoryResponse updateCategory(@PathVariable Long id,
                                                          @Valid @RequestBody DiscussionDtos.CategoryRequest request) {
        return discussionService.updateCategory(id, request);
    }

    @DeleteMapping("/discussion/categories/{id}")
    public Map<String, Boolean> deleteCategory(@PathVariable Long id) {
        discussionService.deleteCategory(id);
        return Map.of("deleted", true);
    }

    // -------------------------------------------------------------- contact inbox

    @GetMapping("/messages")
    public List<PublicDtos.ContactResponse> messages() {
        return contactService.all();
    }

    @PatchMapping("/messages/{id}/read")
    public PublicDtos.ContactResponse markRead(@PathVariable Long id, @RequestParam boolean read) {
        return contactService.markRead(id, read);
    }

    @PutMapping("/messages/{id}")
    public PublicDtos.ContactResponse updateMessage(@PathVariable Long id,
                                                   @RequestBody Map<String, Object> body) {
        String note = body.get("adminNote") == null ? null : String.valueOf(body.get("adminNote"));
        Boolean replied = body.get("replied") == null ? null : Boolean.valueOf(String.valueOf(body.get("replied")));
        return contactService.updateNote(id, note, replied);
    }

    @DeleteMapping("/messages/{id}")
    public Map<String, Boolean> deleteMessage(@PathVariable Long id) {
        contactService.delete(id);
        return Map.of("deleted", true);
    }

    // -------------------------------------------------------------------- settings

    @PutMapping("/settings")
    public PublicDtos.SettingsResponse updateSettings(@Valid @RequestBody PublicDtos.SettingsUpdateRequest request) {
        return contactService.updateSettings(request);
    }
}
