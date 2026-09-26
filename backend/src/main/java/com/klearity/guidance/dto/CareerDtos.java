package com.klearity.guidance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Map;

public record CareerDtos() {

    public record ClassRequest(
            @NotBlank(message = "Class name is required") @Size(max = 80) String name,
            @NotBlank(message = "Class code is required") @Size(max = 30) String code,
            @Size(max = 300) String description,
            Integer sortOrder
    ) {
    }

    public record ClassResponse(Long id, String name, String code, String description, int sortOrder, long itemCount) {
    }

    public record ItemRequest(
            @NotBlank(message = "Title is required") @Size(max = 200) String title,
            @NotNull(message = "Please choose a class") Long classId,
            @NotBlank(message = "Category is required") @Size(max = 120) String category,
            @NotBlank(message = "Description is required") @Size(max = 2000) String description,
            @Size(max = 200) String slug,
            @Size(max = 400) String stream,
            @Size(max = 200) String duration,
            @Size(max = 60) String difficulty,
            @Size(max = 200) String workStyle,
            @Size(max = 500) String interestTags,
            Integer sortOrder,
            Boolean active,
            /** The long-form content shown on the detail page, as a free-form object. */
            Map<String, Object> detail
    ) {
    }

    /** Row shape for the Career Tree list / filter sidebar. */
    public record ItemSummary(
            Long id,
            String title,
            String slug,
            Long classId,
            String className,
            String category,
            String description,
            String duration,
            String stream,
            int sortOrder
    ) {
    }

    /** Full item including the stored dataset detail block. */
    public record ItemDetail(
            Long id,
            String title,
            String slug,
            Long classId,
            String className,
            String classDescription,
            String category,
            String categoryCode,
            String description,
            String stream,
            String duration,
            String difficulty,
            String workStyle,
            List<String> interestTags,
            Object detail,
            int sortOrder,
            boolean active,
            boolean seeded,
            String createdAt,
            String updatedAt
    ) {
    }
}
