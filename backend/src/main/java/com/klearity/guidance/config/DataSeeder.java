package com.klearity.guidance.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.klearity.guidance.domain.*;
import com.klearity.guidance.repository.*;
import com.klearity.guidance.service.CareerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.InputStream;
import java.util.*;

/**
 * Loads the built-in content on first run. Safe to run on every start: everything is
 * upserted by a stable key, so restarting never duplicates rows.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(1)
public class DataSeeder implements CommandLineRunner {

    private static final String SEED_FILE = "seed/careers-150.json";

    private final CareerClassRepository classRepository;
    private final CareerItemRepository itemRepository;
    private final OnboardingQuestionRepository questionRepository;
    private final DiscussionCategoryRepository discussionCategoryRepository;
    private final UserRepository userRepository;
    private final SiteSettingsRepository settingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final CareerService careerService;
    private final ObjectMapper objectMapper;
    private final PlatformTransactionManager transactionManager;

    public static final String ADMIN_EMAIL = "admin@klearity.com";
    public static final String ADMIN_PASSWORD = "Admin@123";

    private static final String COMPANY_NAME = "Klear And Klarity";
    /** The name used before the rename, kept so old databases can be brought up to date. */
    private static final String OLD_BRAND = "Klearity and Klarity";

    // Education-level classes, in the order they appear in the filter sidebar.
    private static final List<Object[]> CLASSES = List.of(
            new Object[]{"10th", "TENTH", "Careers you can start right now, straight after Class 10.", 1},
            new Object[]{"Inter/Diploma", "INTER_DIPLOMA",
                    "ITI trades, Polytechnic and Diploma pathways of one to three years.", 2},
            new Object[]{"UG", "UG", "Bachelor's degree programmes that begin after Class 12.", 3},
            new Object[]{"PG", "PG", "Postgraduate and research qualifications after a first degree.", 4},
            new Object[]{"Others", "OTHERS",
                    "Open school, distance learning, exams, sports, creative arts and flexible routes.", 5}
    );

    /**
     * Dataset category -> class code.
     * C are short skill courses, D are ITI trades, E are diplomas,
     * A and B are bachelor degrees, F are alternative routes.
     */
    private static final Map<String, String> CATEGORY_TO_CLASS = Map.of(
            "C", "TENTH",
            "D", "INTER_DIPLOMA",
            "E", "INTER_DIPLOMA",
            "A", "UG",
            "B", "UG",
            "F", "OTHERS"
    );

    private static final Map<String, List<String>> CATEGORY_INTERESTS = Map.ofEntries(
            Map.entry("A", List.of("Science", "Engineering", "Technology", "Healthcare", "Research")),
            Map.entry("B", List.of("Business", "Finance", "Law", "Humanities", "Management")),
            Map.entry("C", List.of("Design", "Digital Skills", "Marketing", "Vocational", "Creative Arts")),
            Map.entry("D", List.of("Skilling & Trades", "Hands-on Work", "Tools & Machinery", "Production")),
            Map.entry("E", List.of("Diploma", "Engineering", "Technology", "Skilling & Trades", "Applied Sciences")),
            Map.entry("F", List.of("Flexible Learning", "Self-learning", "Distance Learning", "Entrepreneurship"))
    );

    /** Interests the admin can add to or remove from later. */
    private static final List<String> INTERESTS = List.of(
            "Coding & Software", "Data & Analytics", "Engineering & Technology",
            "Medicine & Healthcare", "Science & Research", "Design & Creative Arts",
            "Business & Management", "Finance & Accounting", "Law & Government",
            "Teaching & Education", "Sports & Fitness", "Agriculture & Environment",
            "Skilling & Trades", "Communication & Writing", "Psychology & Counselling",
            "Hospitality & Tourism", "Digital Marketing", "Cybersecurity",
            "Defence & Law Enforcement", "Social Work & NGO", "Aviation",
            "Logistics & Supply Chain", "Beauty & Wellness", "Entrepreneurship",
            "Music & Performing Arts", "Food & Cooking"
    );

    private static final List<String[]> DISCUSSION_CATEGORIES = List.of(
            new String[]{"Career Advice", "Ask anything about choosing or changing a career.", "blue", "1"},
            new String[]{"Stream Selection", "Science, Commerce or Arts - help each other decide.", "indigo", "2"},
            new String[]{"Exams & Entrance", "Entrance exams, forms, dates and preparation.", "violet", "3"},
            new String[]{"Colleges & Admissions", "College choices, admissions and campus life.", "emerald", "4"},
            new String[]{"Skills & Courses", "Short courses, certifications and new skills.", "teal", "5"},
            new String[]{"Study Tips & Learning", "How to study, revise and stay focused.", "amber", "6"},
            new String[]{"Government Jobs", "Competitive exams and government career routes.", "rose", "7"},
            new String[]{"General Discussion", "Anything else worth talking about.", "slate", "8"}
    );

    /**
     * The seed is a convenience, not a startup requirement: if it fails the app still serves
     * traffic, so a bad DB_URL or a missing privilege shows up as a logged cause instead of
     * a deploy that boots and dies. Fix the cause and restart to seed.
     */
    @Override
    public void run(String... args) {
        try {
            new TransactionTemplate(transactionManager).executeWithoutResult(status -> seed());
        } catch (RuntimeException e) {
            log.error("Seeding failed, so no built-in content was loaded by this start. "
                    + "The app is still running. Check DB_URL / DB_USERNAME / DB_PASSWORD, that the "
                    + "database is writable by that user, and the Hibernate schema log above.", e);
        }
    }

    private void seed() {
        seedSettings();
        migrateBrandName();
        seedClasses();
        int items = seedCareerItems();
        seedPostgraduateItems();
        seedQuestions();
        seedDiscussionCategories();
        seedAdmin();

        log.info("--------------------------------------------------");
        log.info(" Klear And Klarity - seed complete");
        log.info(" Career classes : {}", classRepository.count());
        log.info(" Career items   : {} ({} from the 150 dataset)", itemRepository.count(), items);
        log.info(" Onboarding Qs  : {}", questionRepository.count());
        log.info(" Discussions cats: {}", discussionCategoryRepository.count());
        log.info(" Admin login    : {} / {}", ADMIN_EMAIL, ADMIN_PASSWORD);
        log.info("--------------------------------------------------");
    }

    // ------------------------------------------------------------------- settings

    private void seedSettings() {
        if (settingsRepository.existsById(1L)) return;
        settingsRepository.save(SiteSettings.builder()
                .id(1L)
                .companyName("Klear And Klarity")
                .tagline("Career clarity for every student, right after Class 10.")
                .aboutText("""
                        Klear And Klarity is an education-only career guidance platform built for students \
                        who are unsure about what to study next.

                        We turn a large, structured career dataset into three simple tools: a Career Tree that \
                        filters 150+ pathways by the class you are in, a short onboarding questionnaire so we \
                        know what you are interested in, and an open Discussion where students help each other \
                        without anyone having to reveal who they are.

                        We only publish what students can verify. Fees, exam dates, eligibility and scholarship \
                        deadlines change often, so always confirm them against the official institution or \
                        exam source before you make a decision.""" )
                .contactEmail("support@klearity.com")
                .contactPhone("+91 90000 00000")
                .address("Klear And Klarity, India")
                .logoPath("/logo.jpeg")
                .build());
    }

    /**
     * The company was renamed to "Klear And Klarity". Databases seeded before the rename still
     * hold the old default, so replace it here. Only values that still match the old seeded
     * default are touched, which leaves anything an admin has since customised alone.
     */
    private void migrateBrandName() {
        settingsRepository.findById(1L).ifPresent(settings -> {
            boolean changed = false;

            if (OLD_BRAND.equals(settings.getCompanyName())) {
                settings.setCompanyName(COMPANY_NAME);
                changed = true;
            }
            if (settings.getAddress() != null && settings.getAddress().contains(OLD_BRAND)) {
                settings.setAddress(settings.getAddress().replace(OLD_BRAND, COMPANY_NAME));
                changed = true;
            }
            if (settings.getAboutText() != null && settings.getAboutText().contains(OLD_BRAND)) {
                settings.setAboutText(settings.getAboutText().replace(OLD_BRAND, COMPANY_NAME));
                changed = true;
            }

            if (changed) {
                settingsRepository.save(settings);
                log.info(" Brand name updated to {}", COMPANY_NAME);
            }
        });
    }

    // -------------------------------------------------------------------- classes

    private void seedClasses() {
        for (Object[] row : CLASSES) {
            String name = (String) row[0];
            String code = (String) row[1];
            String description = (String) row[2];
            int order = (Integer) row[3];

            if (classRepository.findByCode(code).isPresent()) continue;
            classRepository.save(CareerClass.builder()
                    .name(name).code(code).description(description).sortOrder(order).build());
        }
    }

    // --------------------------------------------------------------- 150 dataset

    private int seedCareerItems() {
        Map<String, CareerClass> classes = careerService.classesByCode();
        int count = 0;

        try (InputStream in = new ClassPathResource(SEED_FILE).getInputStream()) {
            JsonNode root = objectMapper.readTree(in);
            JsonNode careers = root.path("careers");

            for (JsonNode node : careers) {
                String categoryCode = node.path("category_code").asText("F");
                String classCode = CATEGORY_TO_CLASS.getOrDefault(categoryCode, "OTHERS");
                CareerClass careerClass = classes.get(classCode);
                if (careerClass == null) continue;

                String title = node.path("career").asText();
                String externalRef = "SEED-" + node.path("id").asText();

                careerService.upsertSeeded(
                        careerClass,
                        externalRef,
                        title,
                        node.path("slug").asText(null),
                        node.path("category").asText("General"),
                        categoryCode,
                        node.path("simple_explanation_for_student").asText(title),
                        node.path("which_stream").asText(null),
                        node.path("duration").asText(null),
                        node.path("work_environment").asText(null),
                        buildInterestTags(categoryCode, node.path("skills_required").asText("")),
                        node.path("id").asInt(),
                        node.toString());

                count++;
            }
        } catch (Exception e) {
            log.error("Could not read {}: {}", SEED_FILE, e.getMessage());
        }
        return count;
    }

    private String buildInterestTags(String categoryCode, String skills) {
        LinkedHashSet<String> tags = new LinkedHashSet<>(
                CATEGORY_INTERESTS.getOrDefault(categoryCode, List.of()));

        if (skills != null && !skills.isBlank()) {
            for (String part : skills.split(",")) {
                String cleaned = part.trim().replaceAll("\\.$", "");
                if (cleaned.isEmpty() || cleaned.length() > 40) continue;
                tags.add(lowerFirst(cleaned));
            }
        }
        return String.join(",", tags);
    }

    private String lowerFirst(String value) {
        if (value.isEmpty()) return value;
        return Character.toLowerCase(value.charAt(0)) + value.substring(1);
    }

    // ------------------------------------------------------- postgraduate items

    /**
     * The source dataset covers routes from Class 10 up to a first degree, so it has no
     * postgraduate rows. These cards are built only from the postgraduate qualifications
     * the dataset itself names in its higher_studies field, so the PG filter is never
     * empty. The admin can edit, replace or delete any of them.
     */
    private void seedPostgraduateItems() {
        CareerClass pg = classRepository.findByCode("PG").orElse(null);
        if (pg == null) return;

        String[][] rows = {
                {"M.Tech / M.E. (Master of Technology)", "PG", "PG", "PG",
                        "Postgraduate engineering specialisation that deepens your B.Tech/B.E. knowledge and "
                        + "adds research or a specialisation branch.", "2 years after a bachelor's degree"},
                {"M.Sc (Master of Science)", "PG", "PG", "PG",
                        "Postgraduate science degree for specialisation, research and teaching, usually after a "
                        + "B.Sc in a related subject.", "2 years after a bachelor's degree"},
                {"MBA (Master of Business Administration)", "PG", "PG", "PG",
                        "Postgraduate management degree covering finance, marketing, operations and leadership, "
                        + "open to graduates from any discipline.", "2 years after a bachelor's degree"},
                {"MCA (Master of Computer Applications)", "PG", "PG", "PG",
                        "Postgraduate computing programme for graduates who want deeper software, data or "
                        + "cloud skills.", "2 years after a bachelor's degree"},
                {"MA / M.Com / M.Hist (Master of Arts)", "PG", "PG", "PG",
                        "Postgraduate humanities degrees that build subject depth and open teaching, research "
                        + "and civil service routes.", "2 years after a bachelor's degree"},
                {"LLM (Master of Laws)", "PG", "PG", "PG",
                        "Postgraduate law degree for legal practice, judiciary, corporate or academic work.",
                        "2 years after a bachelor's degree"},
                {"M.Arch / M.Plan (Master of Architecture / Planning)", "PG", "PG", "PG",
                        "Postgraduate architecture and town planning degrees that lead to design leadership, "
                        + "urban planning and project management roles.", "2-3 years after a bachelor's degree"},
                {"M.Des (Master of Design)", "PG", "PG", "PG",
                        "Postgraduate design degree with a chosen specialisation, usually supported by a strong "
                        + "portfolio.", "2 years after a bachelor's degree"},
                {"MD / MS / DNB (Postgraduate Medical Degree)", "PG", "PG", "PG",
                        "Postgraduate clinical degrees in medicine and surgery taken after an MBBS, leading to "
                        + "specialist practice.", "3 years after MBBS"},
                {"MDS (Master of Dental Surgery)", "PG", "PG", "PG",
                        "Postgraduate specialisation in dentistry after a BDS degree.",
                        "3 years after BDS"},
                {"M.P.Ed / Sports Science", "PG", "PG", "PG",
                        "Postgraduate degrees in physical education, sports science and sports management.",
                        "2 years after a bachelor's degree"},
                {"PG Diploma / Advanced Diploma", "PG", "PG", "PG",
                        "Postgraduate diploma route - shorter and more focused than a full master's degree, "
                        + "often used for specialisation or career change.",
                        "1-2 years after a bachelor's degree"},
                {"PhD / Research (NET, JRF)", "PG", "PG", "PG",
                        "Doctoral and research routes including the UGC NET exam, for students aiming at "
                        + "research, academia or senior specialist roles.", "3-5 years after a bachelor's degree"}
        };

        for (int i = 0; i < rows.length; i++) {
            String[] r = rows[i];
            careerService.upsertSeeded(pg, "SEED-PG-" + (i + 1), r[0],
                    slug(r[0]), r[1], r[2], r[3], r[4], r[5],
                    "Postgraduate study, specialisation and research", "PG",
                    1000 + i, null);
        }
    }

    private String slug(String value) {
        return value.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }

    // ------------------------------------------------------------------ questions

    private void seedQuestions() {
        if (questionRepository.count() > 0) return;

        OnboardingQuestion classQuestion = OnboardingQuestion.builder()
                .questionText("Which class are you currently in?")
                .description("This decides which careers we show you first in the Career Tree.")
                .answerType(AnswerType.SINGLE_CHOICE)
                .allowOther(true)
                .otherLabel("Others")
                .otherPlaceholder("Tell us your class or qualification, for example: "
                        + "Class 9, Senior Secondary,ITI first year")
                .required(true)
                .active(true)
                .systemQuestion(true)
                .sortOrder(1)
                .options(new ArrayList<>())
                .build();

        addOption(classQuestion, "10th", "I am studying in Class 10 right now.");
        addOption(classQuestion, "Inter/Diploma", "I am in Class 11 or 12, or I have a diploma.");
        addOption(classQuestion, "UG", "I am doing or have finished my bachelor's degree.");
        addOption(classQuestion, "PG", "I am doing or have finished my master's degree.");
        // "Others" is deliberately not a stored option. `allowOther(true)` adds the
        // Others choice in the UI, which stores the sentinel `__OTHER__` plus the
        // student's own text, so a duplicate option would show up twice.
        questionRepository.save(classQuestion);

        OnboardingQuestion interestQuestion = OnboardingQuestion.builder()
                .questionText("What are you interested in?")
                .description("Pick every area that excites you. The admin manages this list, so it changes "
                        + "as students ask for new options.")
                .answerType(AnswerType.MULTI_CHOICE)
                .allowOther(false)
                .required(true)
                .active(true)
                .systemQuestion(true)
                .sortOrder(2)
                .options(new ArrayList<>())
                .build();

        int order = 0;
        for (String interest : INTERESTS) {
            addOption(interestQuestion, interest, null);
            order++;
        }
        questionRepository.save(interestQuestion);
    }

    private void addOption(OnboardingQuestion question, String text, String hint) {
        question.getOptions().add(OnboardingQuestionOption.builder()
                .question(question)
                .optionText(text)
                .optionHint(hint)
                .sortOrder(question.getOptions().size())
                .build());
    }

    // --------------------------------------------------------- discussion seeds

    private void seedDiscussionCategories() {
        for (String[] row : DISCUSSION_CATEGORIES) {
            if (discussionCategoryRepository.findByNameIgnoreCase(row[0]).isPresent()) continue;
            discussionCategoryRepository.save(DiscussionCategory.builder()
                    .name(row[0]).description(row[1]).color(row[2])
                    .sortOrder(Integer.parseInt(row[3]))
                    .active(true)
                    .build());
        }
    }

    // --------------------------------------------------------------------- admin

    private void seedAdmin() {
        if (userRepository.findByEmailIgnoreCase(ADMIN_EMAIL).isPresent()) return;
        userRepository.save(User.builder()
                .fullName("Klearity Admin")
                .firstName("Klearity")
                .contactNumber("9000000000")
                .email(ADMIN_EMAIL)
                .passwordHash(passwordEncoder.encode(ADMIN_PASSWORD))
                .gender(Gender.PREFER_NOT_TO_SAY)
                .role(Role.ADMIN)
                .emailVerified(true)
                .onboardingCompleted(true)
                .mustChangePassword(true)
                .enabled(true)
                .build());
        log.warn("Seeded admin account created - change this password after the first login.");
    }
}
