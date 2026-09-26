package com.klearity.guidance.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.klearity.guidance.domain.CareerClass;
import com.klearity.guidance.domain.CareerItem;
import com.klearity.guidance.dto.CareerDtos;
import com.klearity.guidance.exception.BadRequestException;
import com.klearity.guidance.exception.ConflictException;
import com.klearity.guidance.exception.NotFoundException;
import com.klearity.guidance.repository.CareerClassRepository;
import com.klearity.guidance.repository.CareerItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CareerService {

    private final CareerClassRepository classRepository;
    private final CareerItemRepository itemRepository;
    private final ObjectMapper objectMapper;

    // -------------------------------------------------------------- filter sidebar

    /** Classes plus a live count of items, used by the Career Tree filter sidebar. */
    @Transactional(readOnly = true)
    public List<CareerDtos.ClassResponse> classesWithCounts() {
        return classRepository.findAllByOrderBySortOrderAscIdAsc().stream()
                .map(c -> new CareerDtos.ClassResponse(
                        c.getId(), c.getName(), c.getCode(), c.getDescription(), c.getSortOrder(),
                        itemRepository.countByClass(c.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<String> categories() {
        return itemRepository.findDistinctCategories();
    }

    /**
     * Career Tree listing.
     *
     * @param classId    restrict to one class (the sidebar selection)
     * @param categories restrict to one or more categories
     * @param search     free text over title, description, stream and interest tags
     * @param sort       title | title_desc | newest | class
     */
    @Transactional(readOnly = true)
    public List<CareerDtos.ItemSummary> listItems(Long classId,
                                                 List<String> categories,
                                                 String search,
                                                 String sort) {

        Sort sortSpec = switch (sort == null ? "title" : sort.toLowerCase(Locale.ROOT)) {
            case "title_desc" -> Sort.by(Sort.Direction.DESC, "title");
            case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt");
            case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
            case "class" -> Sort.by(Sort.Direction.ASC, "careerClass.sortOrder")
                    .and(Sort.by(Sort.Direction.ASC, "title"));
            default -> Sort.by(Sort.Direction.ASC, "careerClass.sortOrder")
                    .and(Sort.by(Sort.Direction.ASC, "title"));
        };

        String term = (search == null || search.isBlank()) ? null
                : "%" + search.trim().toLowerCase(Locale.ROOT) + "%";

        return itemRepository.findAll((root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> where = new ArrayList<>();
            where.add(cb.isTrue(root.get("active")));

            if (classId != null) {
                where.add(cb.equal(root.get("careerClass").get("id"), classId));
            }
            if (categories != null && !categories.isEmpty()) {
                where.add(root.get("category").in(categories));
            }
            if (term != null) {
                where.add(cb.or(
                        cb.like(cb.lower(root.get("title")), term),
                        cb.like(cb.lower(root.get("description")), term),
                        cb.like(cb.lower(cb.coalesce(root.get("stream"), "")), term),
                        cb.like(cb.lower(cb.coalesce(root.get("interestTags"), "")), term)));
            }
            return cb.and(where.toArray(new jakarta.persistence.criteria.Predicate[0]));
        }, sortSpec).stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public CareerDtos.ItemDetail detail(Long id) {
        CareerItem item = itemRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Career not found."));

        Object parsed = null;
        if (item.getDetailJson() != null && !item.getDetailJson().isBlank()) {
            try {
                parsed = objectMapper.readValue(item.getDetailJson(), Object.class);
            } catch (Exception ignored) {
                parsed = item.getDetailJson();
            }
        }

        CareerClass cc = item.getCareerClass();
        return new CareerDtos.ItemDetail(
                item.getId(), item.getTitle(), item.getSlug(),
                cc.getId(), cc.getName(), cc.getDescription(),
                item.getCategory(), item.getCategoryCode(), item.getDescription(),
                item.getStream(), item.getDuration(), item.getDifficulty(), item.getWorkStyle(),
                splitTags(item.getInterestTags()), parsed,
                item.getSortOrder(), item.isActive(), item.isSeeded(),
                String.valueOf(item.getCreatedAt()), String.valueOf(item.getUpdatedAt()));
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countsByClass() {
        Map<String, Long> counts = new LinkedHashMap<>();
        classRepository.findAllByOrderBySortOrderAscIdAsc()
                .forEach(c -> counts.put(c.getName(), itemRepository.countByClass(c.getId())));
        return counts;
    }

    // --------------------------------------------------------------- admin manage

    @Transactional
    public CareerDtos.ClassResponse createClass(CareerDtos.ClassRequest request) {
        String code = request.code().trim().toUpperCase(Locale.ROOT);
        if (classRepository.findByCode(code).isPresent()) {
            throw new ConflictException("A class with the code '" + code + "' already exists.");
        }
        if (classRepository.findByNameIgnoreCase(request.name().trim()).isPresent()) {
            throw new ConflictException("A class with that name already exists.");
        }
        CareerClass saved = classRepository.save(CareerClass.builder()
                .name(request.name().trim())
                .code(code)
                .description(request.description())
                .sortOrder(request.sortOrder() != null ? request.sortOrder() : nextClassOrder())
                .build());
        return toClassResponse(saved, 0);
    }

    @Transactional
    public CareerDtos.ClassResponse updateClass(Long id, CareerDtos.ClassRequest request) {
        CareerClass cc = classRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Class not found."));
        String code = request.code().trim().toUpperCase(Locale.ROOT);

        classRepository.findByCode(code).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ConflictException("A class with the code '" + code + "' already exists.");
            }
        });
        classRepository.findByNameIgnoreCase(request.name().trim()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new ConflictException("A class with that name already exists.");
            }
        });

        cc.setName(request.name().trim());
        cc.setCode(code);
        cc.setDescription(request.description());
        if (request.sortOrder() != null) cc.setSortOrder(request.sortOrder());
        classRepository.save(cc);
        return toClassResponse(cc, itemRepository.countByClass(cc.getId()));
    }

    @Transactional
    public void deleteClass(Long id) {
        CareerClass cc = classRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Class not found."));
        long count = itemRepository.countByClass(id);
        if (count > 0) {
            throw new ConflictException("Cannot delete '" + cc.getName() + "' - "
                    + count + " career item(s) still use it. Move or delete them first.");
        }
        classRepository.delete(cc);
    }

    @Transactional
    public CareerDtos.ItemSummary createItem(CareerDtos.ItemRequest request) {
        CareerClass cc = requireClass(request.classId());
        CareerItem item = CareerItem.builder()
                .title(request.title().trim())
                .careerClass(cc)
                .category(request.category().trim())
                .description(request.description().trim())
                .slug(uniqueSlug(request.slug(), request.title(), null))
                .stream(blankToNull(request.stream()))
                .duration(blankToNull(request.duration()))
                .difficulty(blankToNull(request.difficulty()))
                .workStyle(blankToNull(request.workStyle()))
                .interestTags(blankToNull(request.interestTags()))
                .detailJson(writeDetail(request.detail()))
                .sortOrder(request.sortOrder() != null ? request.sortOrder() : nextItemOrder())
                .active(request.active() == null || request.active())
                .seeded(false)
                .build();
        return toSummary(itemRepository.save(item));
    }

    @Transactional
    public CareerDtos.ItemSummary updateItem(Long id, CareerDtos.ItemRequest request) {
        CareerItem item = itemRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Career item not found."));

        item.setTitle(request.title().trim());
        item.setCareerClass(requireClass(request.classId()));
        item.setCategory(request.category().trim());
        item.setDescription(request.description().trim());
        item.setSlug(uniqueSlug(request.slug(), request.title(), id));
        item.setStream(blankToNull(request.stream()));
        item.setDuration(blankToNull(request.duration()));
        item.setDifficulty(blankToNull(request.difficulty()));
        item.setWorkStyle(blankToNull(request.workStyle()));
        item.setInterestTags(blankToNull(request.interestTags()));
        // Only overwrite the stored detail block when the admin actually sent one,
        // so a summary-only edit never wipes the 150-career dataset content.
        String detail = writeDetail(request.detail());
        if (detail != null) item.setDetailJson(detail);
        if (request.sortOrder() != null) item.setSortOrder(request.sortOrder());
        if (request.active() != null) item.setActive(request.active());

        return toSummary(itemRepository.save(item));
    }

    @Transactional
    public void deleteItem(Long id) {
        CareerItem item = itemRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Career item not found."));
        itemRepository.delete(item);
    }

    // -------------------------------------------------------------------- helpers

    /** Used by the seeder to insert / refresh the 150 built-in items. */
    @Transactional
    public CareerItem upsertSeeded(CareerClass cc, String externalRef, String title, String slug,
                                   String category, String categoryCode, String description,
                                   String stream, String duration, String workStyle,
                                   String interestTags, int sortOrder, String detailJson) {
        CareerItem item = itemRepository.findByExternalRef(externalRef).orElseGet(() ->
                CareerItem.builder().externalRef(externalRef).seeded(true).build());
        item.setTitle(title);
        item.setSlug(slug);
        item.setCareerClass(cc);
        item.setCategory(category);
        item.setCategoryCode(categoryCode);
        item.setDescription(description);
        item.setStream(stream);
        item.setDuration(duration);
        item.setWorkStyle(workStyle);
        item.setInterestTags(interestTags);
        item.setSortOrder(sortOrder);
        item.setDetailJson(detailJson);
        item.setActive(true);
        item.setSeeded(true);
        return itemRepository.save(item);
    }

    private CareerClass requireClass(Long classId) {
        return classRepository.findById(classId)
                .orElseThrow(() -> new NotFoundException("Class not found."));
    }

    private String uniqueSlug(String requested, String title, Long selfId) {
        String base = (requested == null || requested.isBlank() ? title : requested)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (base.isBlank()) base = "career-" + System.nanoTime();

        String candidate = base;
        int suffix = 2;
        while (true) {
            Optional<CareerItem> clash = itemRepository.findBySlug(candidate);
            if (clash.isEmpty() || clash.get().getId().equals(selfId)) return candidate;
            candidate = base + "-" + suffix++;
        }
    }

    private int nextClassOrder() {
        List<CareerClass> all = classRepository.findAllByOrderBySortOrderAscIdAsc();
        return all.isEmpty() ? 0 : all.get(all.size() - 1).getSortOrder() + 1;
    }

    private int nextItemOrder() {
        return (int) itemRepository.count();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    /** Serialises the admin supplied detail object back into the stored JSON text. */
    private String writeDetail(Map<String, Object> detail) {
        if (detail == null || detail.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(detail);
        } catch (Exception e) {
            throw new BadRequestException("The detail content could not be saved: " + e.getMessage());
        }
    }

    public static List<String> splitTags(String tags) {
        if (tags == null || tags.isBlank()) return List.of();
        return Arrays.stream(tags.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    public CareerDtos.ItemSummary toSummary(CareerItem item) {
        CareerClass cc = item.getCareerClass();
        return new CareerDtos.ItemSummary(
                item.getId(), item.getTitle(), item.getSlug(),
                cc.getId(), cc.getName(), item.getCategory(), item.getDescription(),
                item.getDuration(), item.getStream(), item.getSortOrder());
    }

    public static CareerDtos.ClassResponse toClassResponse(CareerClass cc, long count) {
        return new CareerDtos.ClassResponse(
                cc.getId(), cc.getName(), cc.getCode(), cc.getDescription(), cc.getSortOrder(), count);
    }

    /** Convenience for the seeder. */
    public Map<String, CareerClass> classesByCode() {
        return classRepository.findAllByOrderBySortOrderAscIdAsc().stream()
                .collect(Collectors.toMap(CareerClass::getCode, Function.identity(), (a, b) -> a));
    }
}
