package com.klearity.guidance.service;

import com.klearity.guidance.domain.DiscussionCategory;
import com.klearity.guidance.domain.DiscussionPost;
import com.klearity.guidance.domain.DiscussionReply;
import com.klearity.guidance.domain.Role;
import com.klearity.guidance.domain.User;
import com.klearity.guidance.dto.DiscussionDtos;
import com.klearity.guidance.exception.BadRequestException;
import com.klearity.guidance.exception.ConflictException;
import com.klearity.guidance.exception.NotFoundException;
import com.klearity.guidance.repository.DiscussionCategoryRepository;
import com.klearity.guidance.repository.DiscussionPostRepository;
import com.klearity.guidance.repository.DiscussionReplyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class DiscussionService {

    private final DiscussionPostRepository postRepository;
    private final DiscussionReplyRepository replyRepository;
    private final DiscussionCategoryRepository categoryRepository;
    private final CurrentUser currentUser;

    // ------------------------------------------------------------------ categories

    @Transactional(readOnly = true)
    public List<DiscussionDtos.CategoryResponse> activeCategories() {
        return categoryRepository.findByActiveTrueOrderBySortOrderAscIdAsc().stream()
                .map(c -> new DiscussionDtos.CategoryResponse(
                        c.getId(), c.getName(), c.getDescription(), c.getColor(),
                        c.getSortOrder(), c.isActive(), 0L))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DiscussionDtos.CategoryResponse> allCategories() {
        return categoryRepository.findAllByOrderBySortOrderAscIdAsc().stream()
                .map(c -> new DiscussionDtos.CategoryResponse(
                        c.getId(), c.getName(), c.getDescription(), c.getColor(),
                        c.getSortOrder(), c.isActive(), 0L))
                .toList();
    }

    @Transactional
    public DiscussionDtos.CategoryResponse createCategory(DiscussionDtos.CategoryRequest request) {
        String name = request.name().trim();
        if (categoryRepository.findByNameIgnoreCase(name).isPresent()) {
            throw new ConflictException("A discussion category with that name already exists.");
        }
        DiscussionCategory saved = categoryRepository.save(DiscussionCategory.builder()
                .name(name)
                .description(blankToNull(request.description()))
                .color(blankToNull(request.color()))
                .sortOrder(request.sortOrder() != null ? request.sortOrder() : nextCategoryOrder())
                .active(request.active() == null || request.active())
                .build());
        return toCategoryResponse(saved, 0);
    }

    @Transactional
    public DiscussionDtos.CategoryResponse updateCategory(Long id, DiscussionDtos.CategoryRequest request) {
        DiscussionCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found."));
        String name = request.name().trim();

        categoryRepository.findByNameIgnoreCase(name).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ConflictException("A discussion category with that name already exists.");
            }
        });

        category.setName(name);
        category.setDescription(blankToNull(request.description()));
        category.setColor(blankToNull(request.color()));
        if (request.sortOrder() != null) category.setSortOrder(request.sortOrder());
        if (request.active() != null) category.setActive(request.active());

        categoryRepository.save(category);
        return toCategoryResponse(category, 0);
    }

    @Transactional
    public void deleteCategory(Long id) {
        DiscussionCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found."));
        category.setActive(false);
        categoryRepository.save(category);
    }

    // ----------------------------------------------------------------------- posts

    @Transactional(readOnly = true)
    public DiscussionDtos.PageResponse<DiscussionDtos.PostResponse> listPosts(
            Long categoryId, String search, int page, int size) {

        if (categoryId != null) {
            categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new NotFoundException("Category not found."));
        }

        String term = (search == null || search.isBlank()) ? null
                : "%" + search.trim().toLowerCase(Locale.ROOT) + "%";

        Pageable pageable = PageRequest.of(
                Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Order.desc("pinned"), Sort.Order.desc("createdAt")));

        Long currentUserId = currentUserOptionalId();

        Page<DiscussionPost> result = postRepository.search(categoryId, term, pageable);

        return new DiscussionDtos.PageResponse<>(
                result.getContent().stream().map(p -> toPostResponse(p, currentUserId)).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(),
                result.getTotalPages(), result.isLast());
    }

    @Transactional(readOnly = true)
    public DiscussionDtos.PostDetailResponse postDetail(Long id) {
        DiscussionPost post = requireVisiblePost(id);
        Long currentUserId = currentUserOptionalId();
        List<DiscussionDtos.ReplyResponse> replies = replyRepository
                .findByPostIdOrderByCreatedAtAsc(post.getId()).stream()
                .filter(r -> !r.isDeleted())
                .map(r -> new DiscussionDtos.ReplyResponse(
                        r.getId(), r.getDisplayName(), r.isAnonymous(), r.getBody(),
                        currentUserId != null && r.getAuthor() != null
                                && currentUserId.equals(r.getAuthor().getId()),
                        r.getCreatedAt()))
                .toList();
        return new DiscussionDtos.PostDetailResponse(toPostResponse(post, currentUserId), replies);
    }

    @Transactional
    public DiscussionDtos.PostResponse createPost(DiscussionDtos.PostRequest request) {
        User user = currentUser.fresh();
        DiscussionCategory category = requireActiveCategory(request.categoryId());

        DiscussionPost post = DiscussionPost.builder()
                .category(category)
                .author(user)
                .displayName(displayName(user, request.anonymous()))
                .anonymous(request.anonymous())
                .title(request.title().trim())
                .body(request.body().trim())
                .build();

        DiscussionPost saved = postRepository.save(post);
        return toPostResponse(saved, user.getId());
    }

    @Transactional
    public DiscussionDtos.PostResponse updatePost(Long id, DiscussionDtos.PostUpdateRequest request) {
        User user = currentUser.fresh();
        DiscussionPost post = requireVisiblePost(id);
        requireOwnerOrAdmin(post, user);

        post.setTitle(request.title().trim());
        post.setBody(request.body().trim());
        return toPostResponse(postRepository.save(post), user.getId());
    }

    @Transactional
    public void deletePost(Long id) {
        User user = currentUser.fresh();
        DiscussionPost post = requireVisiblePost(id);
        requireOwnerOrAdmin(post, user);
        post.setDeleted(true);
        postRepository.save(post);
    }

    @Transactional
    public DiscussionDtos.PostResponse setPinned(Long id, boolean pinned) {
        currentUser.requireAdmin();
        DiscussionPost post = requireVisiblePost(id);
        post.setPinned(pinned);
        return toPostResponse(postRepository.save(post), currentUser.id());
    }

    @Transactional(readOnly = true)
    public List<DiscussionDtos.PostResponse> myPosts() {
        User user = currentUser.fresh();
        return postRepository.findByAuthor(user.getId()).stream()
                .map(p -> toPostResponse(p, user.getId()))
                .toList();
    }

    // --------------------------------------------------------------------- replies

    @Transactional
    public DiscussionDtos.ReplyResponse createReply(Long postId, DiscussionDtos.ReplyRequest request) {
        User user = currentUser.fresh();
        DiscussionPost post = requireVisiblePost(postId);

        DiscussionReply reply = replyRepository.save(DiscussionReply.builder()
                .post(post)
                .author(user)
                .displayName(displayName(user, request.anonymous()))
                .anonymous(request.anonymous())
                .body(request.body().trim())
                .build());

        return new DiscussionDtos.ReplyResponse(
                reply.getId(), reply.getDisplayName(), reply.isAnonymous(), reply.getBody(),
                true, reply.getCreatedAt());
    }

    @Transactional
    public void deleteReply(Long id) {
        User user = currentUser.fresh();
        DiscussionReply reply = replyRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Reply not found."));

        boolean isOwner = reply.getAuthor() != null && reply.getAuthor().getId().equals(user.getId());
        if (!isOwner && user.getRole() != Role.ADMIN) {
            throw new BadRequestException("You can only delete your own replies.");
        }
        reply.setDeleted(true);
        replyRepository.save(reply);
    }

    // -------------------------------------------------------------------- helpers

    private Long currentUserOptionalId() {
        try {
            return currentUser.id();
        } catch (Exception e) {
            return null;
        }
    }

    /** Only the first name, or "Anonymous". Never anything else from the profile. */
    private String displayName(User user, boolean anonymous) {
        return anonymous ? DiscussionReply.ANONYMOUS_NAME : user.getFirstName();
    }

    private DiscussionCategory requireActiveCategory(Long id) {
        DiscussionCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Category not found."));
        if (!category.isActive()) {
            throw new BadRequestException("That category is no longer available.");
        }
        return category;
    }

    private DiscussionPost requireVisiblePost(Long id) {
        DiscussionPost post = postRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Post not found."));
        if (post.isDeleted()) {
            throw new NotFoundException("This post was removed.");
        }
        return post;
    }

    private void requireOwnerOrAdmin(DiscussionPost post, User user) {
        boolean isOwner = post.getAuthor() != null && post.getAuthor().getId().equals(user.getId());
        if (!isOwner && user.getRole() != Role.ADMIN) {
            throw new BadRequestException("You can only change your own posts.");
        }
    }

    private int nextCategoryOrder() {
        List<DiscussionCategory> all = categoryRepository.findAllByOrderBySortOrderAscIdAsc();
        return all.isEmpty() ? 0 : all.get(all.size() - 1).getSortOrder() + 1;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public DiscussionDtos.PostResponse toPostResponse(DiscussionPost post, Long currentUserId) {
        DiscussionCategory c = post.getCategory();
        Long authorId = post.getAuthor() == null ? null : post.getAuthor().getId();
        return new DiscussionDtos.PostResponse(
                post.getId(),
                c.getId(), c.getName(), c.getColor(),
                post.getDisplayName(), post.isAnonymous(),
                post.getTitle(), post.getBody(), post.isPinned(),
                currentUserId != null && currentUserId.equals(authorId),
                replyRepository.countByPostIdAndDeletedFalse(post.getId()),
                post.getCreatedAt(), post.getUpdatedAt());
    }

    public static DiscussionDtos.CategoryResponse toCategoryResponse(DiscussionCategory c, long count) {
        return new DiscussionDtos.CategoryResponse(
                c.getId(), c.getName(), c.getDescription(), c.getColor(),
                c.getSortOrder(), c.isActive(), count);
    }
}
