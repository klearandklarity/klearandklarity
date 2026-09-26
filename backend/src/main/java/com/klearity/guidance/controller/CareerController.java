package com.klearity.guidance.controller;

import com.klearity.guidance.dto.CareerDtos;
import com.klearity.guidance.service.CareerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/careers")
@RequiredArgsConstructor
public class CareerController {

    private final CareerService careerService;

    /** Filter sidebar data: the classes with their live item counts. */
    @GetMapping("/classes")
    public List<CareerDtos.ClassResponse> classes() {
        return careerService.classesWithCounts();
    }

    @GetMapping("/categories")
    public List<String> categories() {
        return careerService.categories();
    }

    /**
     * Career Tree listing.
     * Query: classId, categories (repeatable), search, sort.
     */
    @GetMapping("/items")
    public List<CareerDtos.ItemSummary> items(
            @RequestParam(required = false) Long classId,
            @RequestParam(required = false) List<String> categories,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "title") String sort) {
        return careerService.listItems(classId, categories, search, sort);
    }

    @GetMapping("/counts")
    public Map<String, Long> counts() {
        return careerService.countsByClass();
    }

    @GetMapping("/items/{id}")
    public CareerDtos.ItemDetail item(@PathVariable Long id) {
        return careerService.detail(id);
    }
}
