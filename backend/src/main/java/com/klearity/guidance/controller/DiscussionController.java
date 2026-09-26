package com.klearity.guidance.controller;

import com.klearity.guidance.dto.DiscussionDtos;
import com.klearity.guidance.service.DiscussionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/discussions")
@RequiredArgsConstructor
public class DiscussionController {

    private final DiscussionService discussionService;

    @GetMapping("/categories")
    public List<DiscussionDtos.CategoryResponse> categories() {
        return discussionService.activeCategories();
    }

    /** Filter by admin-defined category, plus free text search across title and body. */
    @GetMapping("/posts")
    public DiscussionDtos.PageResponse<DiscussionDtos.PostResponse> posts(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return discussionService.listPosts(categoryId, search, page, size);
    }

    @GetMapping("/posts/{id}")
    public DiscussionDtos.PostDetailResponse post(@PathVariable Long id) {
        return discussionService.postDetail(id);
    }

    @PostMapping("/posts")
    public DiscussionDtos.PostResponse createPost(@Valid @RequestBody DiscussionDtos.PostRequest request) {
        return discussionService.createPost(request);
    }

    @PutMapping("/posts/{id}")
    public DiscussionDtos.PostResponse updatePost(@PathVariable Long id,
                                                 @Valid @RequestBody DiscussionDtos.PostUpdateRequest request) {
        return discussionService.updatePost(id, request);
    }

    @DeleteMapping("/posts/{id}")
    public java.util.Map<String, Boolean> deletePost(@PathVariable Long id) {
        discussionService.deletePost(id);
        return java.util.Map.of("deleted", true);
    }

    @PatchMapping("/posts/{id}/pin")
    public DiscussionDtos.PostResponse pin(@PathVariable Long id,
                                           @RequestParam boolean pinned) {
        return discussionService.setPinned(id, pinned);
    }

    @GetMapping("/my-posts")
    public List<DiscussionDtos.PostResponse> myPosts() {
        return discussionService.myPosts();
    }

    @PostMapping("/posts/{id}/replies")
    public DiscussionDtos.ReplyResponse reply(@PathVariable Long id,
                                              @Valid @RequestBody DiscussionDtos.ReplyRequest request) {
        return discussionService.createReply(id, request);
    }

    @DeleteMapping("/replies/{id}")
    public java.util.Map<String, Boolean> deleteReply(@PathVariable Long id) {
        discussionService.deleteReply(id);
        return java.util.Map.of("deleted", true);
    }
}
