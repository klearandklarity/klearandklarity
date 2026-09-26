package com.klearity.guidance.domain;

import jakarta.persistence.*;
import lombok.*;

/**
 * Education level a career item belongs to. Drives the Career Tree filter sidebar.
 * Seeded with: 10th, Inter/Diploma, UG, PG, Others.
 */
@Entity
@Table(name = "career_classes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareerClass {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 80, unique = true)
    private String name;

    @Column(name = "code", nullable = false, length = 30, unique = true)
    private String code;

    @Column(name = "description", length = 300)
    private String description;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;
}
