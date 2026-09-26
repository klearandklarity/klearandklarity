GUIDANCE PLUS — 150 CAREER GUIDES / HIGH-LEVEL MVP SEED
==============================================================

Files
-----
1. guidance_plus_150_career_guides_mvp.json
   Canonical nested dataset for application/database seeding.

2. guidance_plus_150_career_guides_mvp.csv
   Spreadsheet-friendly version for review and bulk import.

Data model
----------
Each career contains:
id
slug
category_code
category
career
what_is_it
who_is_it_for
path_after_10th
which_stream
entrance_exams
courses
subjects_you_study
skills_required
specializations
jobs_available
higher_studies
career_growth
work_environment
duration
approx_cost_range_inr
scholarship_possibilities
government_private_opportunities
advantages
challenges
simple_explanation_for_student
mvp_status
last_reviewed

Recommended product use
-----------------------
Home/Explore:
- Show the 150 pathways grouped into 6 categories.
- Let students filter by interest, stream, study duration, learning style and career type.

Career detail page:
- Hero: career name + one-line explanation.
- Tree: 10th -> next step -> exam -> course -> specialization -> job -> higher study -> growth.
- Sections: What is it, Who is it for, Subjects, Skills, Specializations, Jobs, Higher Studies, Work Environment, Cost, Scholarships, Advantages, Challenges.
- CTA: "Is this career right for me?"

Important content rule
----------------------
Do NOT publish exact fees, exam dates, scholarship deadlines or eligibility as permanent facts.
Store them separately as time-sensitive records and verify them from the current official source.

Suggested database separation
-----------------------------
career_pathways
career_eligibility_rules
career_exams
career_courses
career_specializations
career_jobs
career_costs
career_scholarships
career_sources
career_versions

Suggested MVP database fields
-----------------------------
career_pathways:
id, slug, name, category_id, short_description, stream, duration, difficulty,
work_style, interest_tags, created_at, updated_at, status

career_sources:
id, career_id, source_type, source_name, official_url, last_verified_at

Use this dataset as seed content, then attach live/verified source records.
