package com.klearity.guidance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public record DiscussionDtos() {

    public record CategoryRequest(
            @NotBlank(message = "Category name is required") @Size(max = 100) String name,
            @Size(max = 400) String description,
            @Size(max = 30) String color,
            Integer sortOrder,
            Boolean active
    ) {
    }

    public record CategoryResponse(
            Long id, String name, String description, String color, int sortOrder, boolean active, long postCount
    ) {
    }

    public record PostRequest(
            @NotNull(message = "Please choose a category") Long categoryId,
            @NotBlank(message = "Title is required") @Size(min = 3, max = 250) String title,
            @NotBlank(message = "Please write your opinion") @Size(min = 10, max = 8000) String body,
            boolean anonymous
    ) {
    }

    public record PostUpdateRequest(
            @NotBlank @Size(min = 3, max = 250) String title,
            @NotBlank @Size(min = 10, max = 8000) String body
    ) {
    }

    public record ReplyRequest(
            @NotBlank(message = "Please write a reply") @Size(min = 1, max = 4000) String body,
            boolean anonymous
    ) {
    }

    /**
     * Note what is NOT here: no author id, no email, no contact number, no profile link.
     * Only displayName, which is the first name or "Anonymous".
     */
    public record PostResponse(
            Long id,
            Long categoryId,
            String categoryName,
            String categoryColor,
            String displayName,
            boolean anonymous,
            String title,
            String body,
            boolean pinned,
            boolean mine,
            long replyCount,
            Instant createdAt,
            Instant updatedAt
    ) {
    }

    public record ReplyResponse(
            Long id,
            String displayName,
            boolean anonymous,
            String body,
            boolean mine,
            Instant createdAt
    ) {
    }

    public record PostDetailResponse(PostResponse post, List<ReplyResponse> replies) {
    }

    public record PageResponse<T>(
            List<T> content,
            int page,
            int size,
            long totalElements,
            int totalPages,
            boolean last
    ) {
    }
}
