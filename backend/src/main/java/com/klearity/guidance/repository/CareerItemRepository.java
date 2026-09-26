package com.klearity.guidance.repository;

import com.klearity.guidance.domain.CareerItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CareerItemRepository extends JpaRepository<CareerItem, Long>,
        org.springframework.data.jpa.repository.JpaSpecificationExecutor<CareerItem> {

    Optional<CareerItem> findBySlug(String slug);

    Optional<CareerItem> findByExternalRef(String externalRef);

    List<CareerItem> findBySeededTrue();

    long countByActiveTrue();

    @Query("select distinct c.category from CareerItem c where c.active = true and c.category is not null order by c.category asc")
    List<String> findDistinctCategories();

    @Query("select count(c) from CareerItem c where c.active = true and c.careerClass.id = :classId")
    long countByClass(@Param("classId") Long classId);
}
