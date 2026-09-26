package com.klearity.guidance.repository;

import com.klearity.guidance.domain.DiscussionPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DiscussionPostRepository extends JpaRepository<DiscussionPost, Long> {

    /**
     * Category filter + free text search across title and body.
     * Pinned-first ordering is supplied through the Pageable sort.
     */
    @Query("""
            select p from DiscussionPost p
            where p.deleted = false
              and (:categoryId is null or p.category.id = :categoryId)
              and (:search is null
                   or lower(p.title) like :search
                   or lower(p.body) like :search)
            """)
    Page<DiscussionPost> search(@Param("categoryId") Long categoryId,
                                @Param("search") String search,
                                Pageable pageable);

    @Query("select p from DiscussionPost p where p.author.id = :userId and p.deleted = false order by p.createdAt desc")
    List<DiscussionPost> findByAuthor(@Param("userId") Long userId);

    long countByDeletedFalse();

    long countByCategoryId(Long categoryId);
}
