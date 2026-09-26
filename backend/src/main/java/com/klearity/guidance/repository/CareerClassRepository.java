package com.klearity.guidance.repository;

import com.klearity.guidance.domain.CareerClass;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CareerClassRepository extends JpaRepository<CareerClass, Long> {

    Optional<CareerClass> findByCode(String code);

    Optional<CareerClass> findByNameIgnoreCase(String name);

    List<CareerClass> findAllByOrderBySortOrderAscIdAsc();
}
