package com.klearity.guidance.repository;

import com.klearity.guidance.domain.DiscussionCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DiscussionCategoryRepository extends JpaRepository<DiscussionCategory, Long> {

    Optional<DiscussionCategory> findByNameIgnoreCase(String name);

    List<DiscussionCategory> findByActiveTrueOrderBySortOrderAscIdAsc();

    List<DiscussionCategory> findAllByOrderBySortOrderAscIdAsc();
}
