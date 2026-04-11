# Graph Report - /Users/paymore/Desktop/LAURA TRETO COACHING  (2026-04-11)

## Corpus Check
- Large corpus: 128 files · ~777,971 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 433 nodes · 541 edges · 35 communities detected
- Extraction: 79% EXTRACTED · 21% INFERRED · 0% AMBIGUOUS · INFERRED: 111 edges (avg confidence: 0.89)
- Token cost: 1,200 input · 420 output

## God Nodes (most connected - your core abstractions)
1. `Laura Treto (Person / Brand Owner)` - 42 edges
2. `Movement Readiness Score Quiz` - 19 edges
3. `main()` - 14 edges
4. `build_report()` - 12 edges
5. `Laura Treto Outreach Messages` - 9 edges
6. `_load_client()` - 8 edges
7. `main()` - 8 edges
8. `manychat-webhook.js — Claude DM Responder` - 8 edges
9. `CLAUDE.md — Alpha Orchestrator Config` - 8 edges
10. `manychat-webhook.js Netlify Function` - 8 edges

## Surprising Connections (you probably didn't know these)
- `tasks.md — Active Task Tracker` --semantically_similar_to--> `tasks Table`  [INFERRED] [semantically similar]
  tasks.md → build_alpha_db.py
- `Laura DM System Prompt (brand voice + rules)` --semantically_similar_to--> `Laura Treto Client Profile`  [INFERRED] [semantically similar]
  website/netlify/functions/manychat-webhook.js → CLAUDE.md
- `content_pillars Table` --semantically_similar_to--> `Content Strategy (7 Pillars, Magnet-Connection-Conversion)`  [INFERRED] [semantically similar]
  build_alpha_db.py → CLAUDE.md
- `Movement Readiness Score Quiz` --rationale_for--> `Concept: Bridging Physical Therapy to Weight Room Gap`  [INFERRED]
  strategy/LEAD-MAGNET-SPEC.md → docs/Laura Treto Wellness Coach .pdf
- `Movement Readiness Score Quiz` --conceptually_related_to--> `Target Demographic: Adults 40+`  [INFERRED]
  strategy/LEAD-MAGNET-SPEC.md → docs/Laura Treto Wellness Coach .pdf

## Hyperedges (group relationships)
- **Instagram Content Publish Pipeline** — infographic_pipeline_script, infographic_pipeline_canva_mcp, post_to_instagram_script, build_alpha_db_content_log_table, post_to_instagram_meta_graphapi [EXTRACTED 0.95]
- **ManyChat Claude DM Auto-Response Pipeline** — manychat_webhook_function, manychat_webhook_claude_haiku, manychat_webhook_netlify_blobs, manychat_webhook_funnel_tagging, manychat_webhook_non_text_guard [EXTRACTED 0.97]
- **Quiz to Email Funnel (quiz → MailerLite → GA4 tracking)** — quiz_subscribe_function, quiz_subscribe_tier_groups, quiz_subscribe_mailerlite, ga4_report_quiz_funnel [INFERRED 0.88]
- **Instagram DM Automation Pipeline (ManyChat + Claude + Tagging)** — manychat_webhook_js, claude_haiku, manychat_platform, detect_funnel_tags_fn, tag_subscriber_fn [EXTRACTED 0.97]
- **Quiz-to-Email Nurture Funnel (Quiz + ConvertKit/MailerLite + Movement Assessment)** — quiz_html, convertkit_integration, mailerlite_automation, movement_assessment_service [INFERRED 0.88]
- **TikTok Integration Build (App + Sandbox + Netlify OAuth Callback)** — tiktok_app_laura, tiktok_sandbox_alpha_dev, tiktok_login_kit, tiktok_content_posting_api, tiktok_oauth_callback_fn [EXTRACTED 0.93]
- **Laura Treto Multi-Domain Professional Identity** — laura_treto_person, dancer_credential_o1b_visa, dancer_credential_nasm_cpt, dancer_education_psych_havana, dancer_education_ballet_cuba, tm_stat_1000_career_shows [EXTRACTED 0.98]
- **Dance Companies Laura Performed With** — laura_treto_person, dancer_org_acosta_danza, dancer_org_danza_contemporanea, dancer_org_ballet_tv_cubana, dancer_org_ballet_rakatan, dancer_org_world_champion_productions [EXTRACTED 1.00]
- **Notable Choreographers Laura Worked With** — laura_treto_person, dancer_choreographer_justin_peck, dancer_choreographer_sidi_larbi, dancer_choreographer_carlos_acosta, dancer_choreographer_christopher_bruce, dancer_choreographer_goyo_montero [EXTRACTED 1.00]
- **Movement Readiness Score Lead Magnet Funnel** — leadmagnet_movement_readiness_score, leadmagnet_email_sequence, leadmagnet_cta_assessment, leadmagnet_cta_email_guide, leadmagnet_tech_option_a [EXTRACTED 0.98]
- **Quiz Score Result Bands** — leadmagnet_score_movement_strong, leadmagnet_score_movement_ready, leadmagnet_score_movement_rebuilder, leadmagnet_score_movement_starter [EXTRACTED 1.00]
- **Laura's Wellness Coaching Skill Set** — wellness_skill_functional_training, wellness_skill_wellness_coaching, wellness_skill_nutrition, wellness_skill_mobility_flexibility, dancer_credential_nasm_cpt [EXTRACTED 0.97]
- **Laura's Roles with The Mavericks** — laura_treto_person, tm_org_the_mavericks, tm_role_tour_manager, tm_role_wellness_coach_assistant, wellness_client_mavericks_lead_singer [EXTRACTED 1.00]
- **Laura Treto Website Brand Photo Shoot Collection** — lt_website_8_kettlebell_standing_portrait, lt_website_hero_confident_pose, lt_website_1_full_body_smiling, lt_website_3_dance_silhouette_sunset, lt_website_2_kettlebell_press_silhouette [INFERRED 0.93]
- **Fitness Authority Brand Visuals** — lt_website_8_kettlebell_standing_portrait, lt_website_hero_confident_pose, lt_website_1_full_body_smiling, lt_website_2_kettlebell_press_silhouette, brand_fitness_authority [INFERRED 0.90]
- **Dance and Movement Artistry Brand Visuals** — lt_website_3_dance_silhouette_sunset, brand_dance_artistry, key_west_outdoor_setting [INFERRED 0.88]
- **Laura Treto Kettlebell Scroll Animation - Ocean Backdrop Key West** — frame_001, frame_002, frame_003, frame_004, frame_005, frame_006, frame_007, frame_008, frame_009, frame_010, frame_011, frame_012, frame_013, frame_014, frame_015, frame_016, frame_017, frame_018, frame_019, frame_020, frame_021, frame_022, frame_023, frame_024, frame_025, frame_026, frame_027, frame_028, frame_029, frame_030, frame_031, frame_032, frame_033, frame_034, frame_035, frame_036, frame_037, frame_038, frame_039, frame_040, frame_041, frame_042, frame_043, frame_044, frame_045, frame_046, frame_047, frame_048, frame_049 [EXTRACTED 1.00]

## Communities

### Community 0 - "Laura Pro Background & Credentials"
Cohesion: 0.06
Nodes (42): Carlos Acosta (Choreographer), Christopher Bruce (Choreographer), Goyo Montero (Choreographer), Justin Peck (Choreographer), Sidi Larbi Cherkaoui (Choreographer), NASM Certified Personal Trainer, O-1B Visa (Extraordinary Ability), Professional Ballet Graduation - Cuban National School of Ballet (+34 more)

### Community 1 - "Alpha Database Schema"
Cohesion: 0.08
Nodes (33): alpha.db — SQLite Operational Brain, clients Table, content_log Table, content_pillars Table, content_templates Table, build_alpha_db.py — Alpha DB Builder, services Table, tasks Table (+25 more)

### Community 2 - "ManyChat DM Automation"
Cohesion: 0.07
Nodes (31): alpha.db SQLite Database, Claude Haiku (claude-haiku-4-5-20251001), detectFunnelTags() Function, ManyChat Tag: lead_booking_interest, ManyChat Tag: lead_desk_pain, ManyChat Tag: lead_general_inquiry, ManyChat Tag: lead_pricing, ManyChat Tag: lead_quiz_complete (+23 more)

### Community 3 - "Scroll Animation Early Frames"
Cohesion: 0.07
Nodes (31): Frame 001 - Standing Ready Position (Kettlebell at Chest), Frame 002 - Kettlebell Exercise Sequence Frame 2, Frame 003 - Kettlebell Exercise Sequence Frame 3, Frame 004 - Kettlebell Exercise Sequence Frame 4, Frame 005 - Kettlebell Exercise Sequence Frame 5, Frame 006 - Kettlebell Exercise Sequence Frame 6, Frame 007 - Kettlebell Exercise Sequence Frame 7, Frame 008 - Kettlebell Exercise Sequence Frame 8 (+23 more)

### Community 4 - "Strategy & Competitive Research"
Cohesion: 0.07
Nodes (30): codex-sync/inbox/ Folder, Codex Cross-Model Sync Protocol, Competitive Analysis: Laura Treto Coaching, Competitor: CrossFit Mile Zero, Competitor: Sweat Society KW, Competitor: WeBeFit Personal Training, Online Competitor: The Workout Witch (Tenuto), Content Engine Strategy Document (+22 more)

### Community 5 - "Alpha DB Builder Code"
Cohesion: 0.11
Nodes (27): create_indexes(), create_tables(), main(), populate_calendar_events(), populate_clients(), populate_completed_tasks(), populate_contacts(), populate_content_pillars() (+19 more)

### Community 6 - "Analytics & KPI Reporting"
Cohesion: 0.09
Nodes (26): GA4 Property — Laura Treto Coaching (G-D8L9H56MED), Quiz Funnel Events (quiz_start, quiz_complete, email_signup), ga4_report.py — GA4 Data API Reporter, GA4 Service Account JSON Credentials, Output/weekly-kpi-report-YYYY-MM-DD.md, ga4_weekly_report.py — Weekly KPI Report Generator, Claude Haiku 4-5 (DM Response Model), manychat-webhook.js — Claude DM Responder (+18 more)

### Community 7 - "Lead Magnet Quiz Funnel"
Cohesion: 0.08
Nodes (26): Primary CTA: Book Movement Assessment ($125), Secondary CTA: Free 5-Day Email Guide, Email 1: Score Recap (Immediate), Email 2: Top Fix (Day 2), Email 3: Laura's Story (Day 4), Email 4: What Happens in a Session (Day 7), Email 5: Free Exercise (Day 10), 5-Email Nurture Sequence (10 Days) (+18 more)

### Community 8 - "Email Marketing Automation"
Cohesion: 0.12
Nodes (19): ConvertKit Visual Automation (5-email nurture), ConvertKit Custom Fields (score, tier, goal_tag, weakest_areas), ConvertKit Integration (Quiz to Email), ConvertKit / Kit Email Platform, ConvertKit Tags (8 tags: 4 tiers + 4 goals), Email Setup Guide: Movement Readiness Funnel, MailerLite Automation: Laura Treto, MailerLite Automation Build Guide (+11 more)

### Community 9 - "Scroll Animation Late Frames"
Cohesion: 0.11
Nodes (19): Frame 031 - Kettlebell Exercise Sequence Frame 31, Frame 032 - Kettlebell Exercise Sequence Frame 32, Frame 033 - Kettlebell Exercise Sequence Frame 33, Frame 034 - Kettlebell Exercise Sequence Frame 34, Frame 035 - Kettlebell Exercise Sequence Frame 35, Frame 036 - Kettlebell Exercise Sequence Frame 36, Frame 037 - Kettlebell Exercise Sequence Frame 37, Frame 038 - Kettlebell Exercise Sequence Frame 38 (+11 more)

### Community 10 - "Brand Visual Identity"
Cohesion: 0.23
Nodes (17): Laura Treto Coaching Brand Identity, Movement Artistry Brand Concept, Key West Outdoor Setting - Coastal Environment, Outdoor Key West Setting, Silhouette Dramatic Visual Style, Strength Coaching Brand Concept, Sunset / Golden Hour Aesthetic, Hero Image (1024w) - Dance Movement Pose at Sunset Pier (+9 more)

### Community 11 - "GA4 Weekly Report Code"
Cohesion: 0.3
Nodes (14): build_report(), _date_range(), date_str(), fetch_daily_users(), fetch_event_counts(), fetch_top_pages(), fetch_top_sources(), fetch_totals() (+6 more)

### Community 12 - "GA4 Report Commands Code"
Cohesion: 0.4
Nodes (13): build_parser(), cmd_events(), cmd_funnel_quiz(), cmd_realtime(), cmd_sources(), cmd_summary(), _date_range(), _err() (+5 more)

### Community 13 - "Infographic Pipeline Code"
Cohesion: 0.29
Nodes (11): fill_template_prompt(), get_template(), list_templates(), load_templates(), log_to_db(), main(), post_to_instagram(), print_canva_instructions() (+3 more)

### Community 14 - "Webhook Function Code"
Cohesion: 0.17
Nodes (0): 

### Community 15 - "Brand Photography Batch 1"
Cohesion: 0.42
Nodes (9): Brand Visual Theme: Dance and Movement Artistry, Brand Visual Theme: Fitness Authority, Key West Outdoor / Waterfront Setting, Laura Treto - Wellness Coach and Subject, Laura Treto Full Body Smiling Outdoor Portrait, Laura Treto Kettlebell Overhead Press Silhouette at Sunset, Laura Treto Dance Silhouette at Sunset Over Water, Laura Treto Kettlebell Standing Portrait - Overcast Sky (+1 more)

### Community 16 - "Sunset Fitness Silhouettes"
Cohesion: 0.54
Nodes (8): Key West Outdoor Fitness Aesthetic, Laura Treto Coaching Brand, Laura Treto Silhouette Sumo Squat Medicine Ball Ocean Sunset Standing Ground, Laura Treto Silhouette Wide Squat with Medicine Ball Ocean Sunset, Laura Treto Silhouette Lunge with Medicine Ball at Sunset, Laura Treto Confident Headshot Black Tank White Background, Laura Treto Silhouette Lunge Medicine Ball Sunset Sky Wider Crop, Medicine Ball Sunset Silhouette Training Series

### Community 17 - "Instagram Post Code"
Cohesion: 0.43
Nodes (6): load_credentials(), main(), post_carousel(), post_single(), Create a media container then publish it. Returns API response dict., Create child containers, a parent carousel container, then publish.

### Community 18 - "Meta API & Credentials"
Cohesion: 0.4
Nodes (6): Credentials File: .credentials/api_keys.json, Facebook Page: Laura Treto, Fitness Trainer (ID 599537857146045), Instagram Business Account: @coachlauratreto (ID 17841403861596917), Meta Developer App: Alpha (App ID 178221487607084), Meta Graph API, Meta Business Suite Setup & Access Guide

### Community 19 - "Quiz Subscribe Code"
Cohesion: 0.4
Nodes (0): 

### Community 20 - "Hero & OG Images"
Cohesion: 0.5
Nodes (5): Hero Image 640w: Dance Plie Silhouette on Pier at Sunset, Hero Image Full: Dance Plie Silhouette on Pier at Sunset, Laura Movement: Sprint Start Position Silhouette at Sunrise, LT Website Photo: Kettlebell Press Silhouette at Sunset, OG Image: Brand Social Share Card (Kettlebell Sunset Silhouette)

### Community 21 - "Animated & Hero Visuals"
Cohesion: 0.5
Nodes (5): Dancing Lady AI-Generated Animation, Scroll Animation Frame 048 – Kettlebell Pose Ocean Background, Laura Treto Sunset Silhouette Hero Image 640w, Laura Treto Kettlebell Standing Portrait, Laura Treto Smiling Headshot

### Community 22 - "App Icon Drawing Code"
Cohesion: 0.5
Nodes (0): 

### Community 23 - "Social Feed Code"
Cohesion: 0.83
Nodes (3): fetchAllPages(), fetchFacebookPosts(), fetchInstagramPosts()

### Community 24 - "Events & AI Pipeline Strategy"
Cohesion: 0.5
Nodes (4): AI-Automated Editing Pipeline (build priority), Salsa Sunset Event (Mallory Square, May 3), Strategy Questionnaire Answers (Alex Mene), Strategy Questionnaire

### Community 25 - "Trainerize Integration"
Cohesion: 0.5
Nodes (4): Trainerize API Reference (122 endpoints), Trainerize API & Integration Research, Trainerize Checkout Links (booking integration), Trainerize Zapier Integration

### Community 26 - "Contingency Playbook"
Cohesion: 0.67
Nodes (3): Contingency Scenario 2: Content Volume Drops (Perfectionism), Contingency Playbook (4-Week Launch), Contingency Scenario 1: Zero Local Bookings After 2 Weeks

### Community 27 - "Paid Ads Strategy"
Cohesion: 0.67
Nodes (3): Meta Ads (Instagram + Facebook) Strategy, Paid Ads Strategy Month 2 (May 2026), TikTok Ads Strategy (Weeks 3-4 Month 2)

### Community 28 - "TikTok App Icon"
Cohesion: 1.0
Nodes (2): LAURA-tiktok-app-icon-1024.png — Output Icon, make_app_icon.py — TikTok App Icon Generator

### Community 29 - "Calendar & Codex Handoff"
Cohesion: 1.0
Nodes (2): ACTION-CALENDAR-WEEKS-1-4.md — Day-by-Day Game Plan, CODEX-CALENDAR-HANDOFF.md — Google Calendar Event Script

### Community 30 - "Bilingual Content Guidelines"
Cohesion: 1.0
Nodes (2): Bilingual Content Guidelines, Language Decision Framework (EN/ES)

### Community 31 - "Credentials Vault"
Cohesion: 1.0
Nodes (1): Credentials Vault Concept (alpha.db)

### Community 32 - "App Icon Image"
Cohesion: 1.0
Nodes (1): Laura Treto Coaching TikTok App Icon

### Community 33 - "Kettlebell Icon"
Cohesion: 1.0
Nodes (1): Kettlebell Icon Symbol

### Community 34 - "Brand Background Asset"
Cohesion: 1.0
Nodes (1): Coral Red Rounded Square Background

## Knowledge Gaps
- **157 isolated node(s):** `Create all 13 tables with proper constraints.`, `Create useful indexes for common queries.`, `Clients from CLAUDE.md.`, `Contacts from CLAUDE.md.`, `Services from CLAUDE.md pricing table.` (+152 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `TikTok App Icon`** (2 nodes): `LAURA-tiktok-app-icon-1024.png — Output Icon`, `make_app_icon.py — TikTok App Icon Generator`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Calendar & Codex Handoff`** (2 nodes): `ACTION-CALENDAR-WEEKS-1-4.md — Day-by-Day Game Plan`, `CODEX-CALENDAR-HANDOFF.md — Google Calendar Event Script`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Bilingual Content Guidelines`** (2 nodes): `Bilingual Content Guidelines`, `Language Decision Framework (EN/ES)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Credentials Vault`** (1 nodes): `Credentials Vault Concept (alpha.db)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Icon Image`** (1 nodes): `Laura Treto Coaching TikTok App Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Kettlebell Icon`** (1 nodes): `Kettlebell Icon Symbol`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Brand Background Asset`** (1 nodes): `Coral Red Rounded Square Background`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Laura Treto (Person / Brand Owner)` connect `Laura Pro Background & Credentials` to `Lead Magnet Quiz Funnel`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `Movement Readiness Score Quiz` connect `Lead Magnet Quiz Funnel` to `Laura Pro Background & Credentials`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `tasks.md — Active Task Tracker` connect `Analytics & KPI Reporting` to `Alpha Database Schema`?**
  _High betweenness centrality (0.008) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Laura Treto (Person / Brand Owner)` (e.g. with `Movement Readiness Score Quiz` and `dancing-lady.mp4 (Animated/AI Dance Figure Video)`) actually correct?**
  _`Laura Treto (Person / Brand Owner)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `Movement Readiness Score Quiz` (e.g. with `Laura Treto (Person / Brand Owner)` and `Concept: Bridging Physical Therapy to Weight Room Gap`) actually correct?**
  _`Movement Readiness Score Quiz` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `Laura Treto Outreach Messages` (e.g. with `Output/ Folder (Deliverables for Alex/Laura)` and `Outreach Kit Document`) actually correct?**
  _`Laura Treto Outreach Messages` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Create all 13 tables with proper constraints.`, `Create useful indexes for common queries.`, `Clients from CLAUDE.md.` to the rest of the system?**
  _157 weakly-connected nodes found - possible documentation gaps or missing edges._