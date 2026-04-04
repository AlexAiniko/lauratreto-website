# Laura Treto Coaching -- Framer Website Build Spec

**Version:** 1.0
**Created:** 2026-04-02
**Author:** Max (MVP & Product Builder)
**Status:** Ready for Build

---

## 1. PROJECT OVERVIEW

| Field | Detail |
|-------|--------|
| Project | Single-page scrolling website for Laura Treto Coaching |
| Platform | Framer (framer.com) |
| Domain | lauratreto.com (currently on Squarespace DNS -- migration required) |
| Type | Single-page, 9 sections, mobile-first |
| Timeline | 4 days (April 3-6, 2026) |
| Goal | Replace dormant Squarespace site with a high-converting coaching landing page |

### What This Site Replaces
Laura's current Squarespace site at lauratreto.com has noindex enabled and generic "Fitness Trainer" messaging. It does not reflect her credentials, positioning, or current services. This Framer build is a clean restart.

---

## 2. BRAND IDENTITY

### 2.1 Brand Feel

| Attribute | Description |
|-----------|-------------|
| **Premium** | High-quality photography, generous whitespace, confident typography. Not cold or corporate -- warm and inviting. |
| **Exotic** | Cuban heritage, Acosta Danza, international career. The site should feel worldly, not small-town. |
| **Spicy** | Bold, confident, unapologetic. Not generic fitness. Laura is not a gym trainer -- she is a world-class movement artist turned coach. |
| **Warm** | Key West energy. Tropical, sun-drenched, alive. The site should feel like stepping outside into golden hour. |

### 2.2 Color Palette

Primary palette inspired by Key West sunsets:

| Color | Hex (suggested) | Usage |
|-------|-----------------|-------|
| **Coral** | #E8654A | Primary accent, CTAs, buttons, hover states |
| **Deep Turquoise** | #1A7A7A | Secondary accent, section backgrounds, credential bar |
| **Warm White** | #FAF7F2 | Page background, card backgrounds |
| **Clean White** | #FFFFFF | Text on dark sections, card surfaces |
| **Charcoal** | #2B2B2B | Body text, headings on light backgrounds |
| **Gold** | #C5973E | Subtle accents, icons, credential highlights, dividers |
| **Soft Sand** | #F0E6D8 | Alternate section backgrounds for visual rhythm |

**Rules:**
- Never use pure black (#000000). Use Charcoal for text.
- Coral is the action color -- all CTAs, buttons, and interactive elements use Coral.
- Turquoise is the trust color -- credentials, testimonials, authority sections.
- Alternate section backgrounds between Warm White and Soft Sand to create visual rhythm without heavy dividers.

### 2.3 Typography

| Role | Font | Weight | Size (desktop / mobile) |
|------|------|--------|------------------------|
| **H1 (Hero headline)** | Playfair Display (serif) | 700 Bold | 56px / 36px |
| **H2 (Section titles)** | Playfair Display (serif) | 600 Semi-Bold | 40px / 28px |
| **H3 (Card titles)** | Inter or DM Sans (sans-serif) | 600 Semi-Bold | 24px / 20px |
| **Body text** | Inter or DM Sans (sans-serif) | 400 Regular | 17px / 16px |
| **Body text (small)** | Inter or DM Sans (sans-serif) | 400 Regular | 15px / 14px |
| **Buttons** | Inter or DM Sans (sans-serif) | 600 Semi-Bold | 16px / 15px |
| **Caption / Label** | Inter or DM Sans (sans-serif) | 500 Medium | 13px / 12px, uppercase, letter-spacing 1.5px |

**Rules:**
- Serif (Playfair Display) is ONLY for H1 and H2 -- the premium, editorial feel.
- Everything else uses the clean sans-serif for readability.
- Line height: 1.5 for body, 1.2 for headings.
- Max body text width: 680px (readability constraint).

### 2.4 Photography Direction

| Type | Usage | Notes |
|------|-------|-------|
| Laura performing | Hero section, About section | Dance, movement, dynamic poses. Full body or 3/4 frame. |
| Laura coaching | How It Works, Services | Working with a client (real or staged). Warm, professional. |
| Key West landscapes | Background accents, section dividers | Golden hour, water, tropical foliage. NOT stock -- real KW shots. |
| Headshot | About section | Professional, warm, approachable. Not a corporate headshot -- personality showing. |

**Photo treatment:**
- Slight warm color grade across all images for consistency.
- Hero image may have a subtle dark gradient overlay (bottom 40%) for text readability.
- No heavy filters, no black-and-white, no desaturation.

---

## 3. PAGE STRUCTURE -- SECTION-BY-SECTION

### Section 1: HERO

**Layout:** Full-viewport height. Full-width background image or video. Content centered vertically.

**Background:**
- Option A: Full-bleed photo of Laura in movement (dance or coaching). Dark gradient overlay on bottom half for text contrast.
- Option B: Looping video (8-10 seconds, muted, autoplay). Laura dancing, stretching, or coaching. Compressed to under 3MB for speed.
- Decision needed from Alex: photo or video? If video, does footage exist?

**Content (centered over background):**

```
[H1] World-Class Movement Coaching. Now in Key West.

[Subhead - body text, light color]
Founding member of Acosta Danza. O-1B visa holder.
1,000+ international performances. Now helping adults
move with strength, confidence, and joy.

[Two buttons side by side]
[CORAL BUTTON] Book Your Assessment     [WHITE OUTLINE BUTTON] Take the Free Movement Test
```

**Button behavior:**
- "Book Your Assessment" -- smooth scrolls to Section 8 (Inquiry Form)
- "Take the Free Movement Test" -- opens quiz (Tally embed or external link)

**Mobile:**
- Stack buttons vertically
- Reduce headline size per typography table
- Ensure hero image focal point (Laura) stays centered on crop

**Animations:**
- Subtle fade-in on headline (0.3s delay after load)
- Buttons fade in 0.2s after headline
- NO parallax on mobile (performance)

---

### Section 2: CREDENTIAL BAR

**Layout:** Horizontal strip, full-width. Background: Deep Turquoise (#1A7A7A). Text: White.

**Content:** 6 credential items displayed horizontally (desktop) or in a 2x3 grid (mobile).

| # | Icon | Text |
|---|------|------|
| 1 | Dance/ballet icon | Acosta Danza Founding Member |
| 2 | Visa/passport icon | O-1B Visa (Extraordinary Ability) |
| 3 | Globe/stage icon | 1,000+ International Performances |
| 4 | Film reel icon | Yuli Film Credit |
| 5 | University cap icon | University of Havana -- Clinical Psychology |
| 6 | Certificate icon | NASM Certified Personal Trainer |

**Design details:**
- Icons: simple line icons, white, 28px. Use Phosphor Icons or Lucide (both available in Framer).
- Text: Caption style (13px, uppercase, letter-spacing 1.5px).
- Horizontal layout with subtle dividers (thin gold lines or just spacing).
- This section should feel like a trust banner -- quick, scannable, authoritative.

**Mobile:**
- 2 columns, 3 rows. Same icons and text, slightly smaller.

**Assets needed from Alex:**
- Acosta Danza logo (if available and usage approved). Otherwise, text-only.
- Confirm: is "Yuli Film Credit" the correct phrasing? Or should it be "Featured in Yuli (2018 Film)"?

---

### Section 3: WHO I HELP

**Layout:** Background: Soft Sand (#F0E6D8). Three cards/columns, equal width.

**Section header:**
```
[H2] Not Your Average Fitness Client
[Subtitle] Laura works with people who need more than a generic workout plan.
```

**Three cards:**

| Card | Icon | Headline | Body |
|------|------|----------|------|
| 1 | Person with mobility lines | Adults 45+ Feeling Stiff or Unstable | You used to move easily. Now getting off the floor takes thought. You're not injured -- you're disconnected. Laura bridges that gap. |
| 2 | Arrow bridge icon | Between PT Discharge and Confident Training | Your physical therapist cleared you. But you don't feel ready for a gym. Laura picks up where PT left off. |
| 3 | Sparkle/upgrade icon | Anyone Who Wants More Than Reps and Sets | You've done the classes. You've had trainers. Nobody looked at HOW you move. Laura does. |

**Card design:**
- White (#FFFFFF) card surface with subtle shadow (0px 4px 20px rgba(0,0,0,0.06))
- Rounded corners: 12px
- Padding: 32px
- Icon: Coral (#E8654A), 40px
- Headline: H3 style
- Body: Body text style
- No button on cards -- this section educates, doesn't convert directly

**Mobile:**
- Cards stack vertically with 16px gap between them

---

### Section 4: HOW IT WORKS

**Layout:** Background: Warm White (#FAF7F2). Three steps in a horizontal row.

**Section header:**
```
[H2] How It Works
[Subtitle] Three steps to moving with confidence again.
```

**Three steps:**

| Step | Number | Title | Description | Icon/Visual |
|------|--------|-------|-------------|-------------|
| 1 | 01 | Take the Free Assessment | A 2-minute online quiz that reveals your movement strengths and blind spots. No camera, no gym -- just honest answers. | Clipboard/quiz icon |
| 2 | 02 | Book a Private Session | Meet Laura in person in Key West. She watches how you move, identifies patterns, and builds your plan. $125 for your first session. | Calendar/person icon |
| 3 | 03 | Move With Confidence | A personalized coaching plan built around YOUR body. Not a template. Not an app. Real coaching from a world-class mover. | Checkmark/strength icon |

**Design details:**
- Step numbers: large (48px), Gold (#C5973E), Playfair Display
- A subtle connecting line or dots between steps (horizontal on desktop, vertical on mobile)
- Icons: Coral, 36px, Phosphor or Lucide
- Each step is a vertical stack: number, icon, title, description

**Mobile:**
- Steps stack vertically. Connecting line runs vertically between them.

---

### Section 5: ABOUT LAURA

**Layout:** Two-column (desktop). Left: photo. Right: text. Background: Soft Sand (#F0E6D8).

**Left column (50%):**
- Professional photo of Laura. Warm, showing personality. Not a corporate headshot -- movement, life, warmth.
- Photo should be tall/portrait orientation, rounded corners (12px), subtle shadow.

**Right column (50%):**

```
[H2] Meet Laura

[Body text]
Laura Treto spent a decade as a founding member of Acosta Danza --
Carlos Acosta's world-renowned dance company. She performed over
1,000 shows across five continents, earned an O-1B visa for
extraordinary ability, and holds a clinical psychology degree
from the University of Havana.

Today she lives in Key West, where she coaches adults who want
more than a workout. Her approach blends elite movement training,
body awareness, and the empathy of someone who understands that
the body holds more than muscle.

[Testimonial block - styled differently]
"Laura helped me walk again without pain."
-- Raul Malo, The Mavericks

[Small text, muted color]
Grammy-nominated artist. 1958-2023.

[Link] Read more about Laura's story ->
```

**Testimonial design:**
- Large quotation mark (decorative, Gold, 60px)
- Quote text: Playfair Display italic, 22px
- Attribution: Body text, muted color
- The testimonial should feel tasteful and integrated, not a billboard

**Mobile:**
- Photo stacks above text (full width, max-height 400px, object-fit cover)
- Text below, full width with padding

**Copy source:** Bio rewrites in CONTENT-ENGINE.md Section 10 and strategic recommendations. Do NOT rewrite -- use existing approved copy and adapt for web format.

**Asset needed from Alex:**
- Professional photo of Laura (warm, personality-showing)
- Confirm: is the Raul Malo quote exactly "Laura helped me walk again without pain"? Has this been approved for public use?

---

### Section 6: SERVICES & PRICING

**Layout:** Background: Warm White (#FAF7F2). Pricing cards in a row.

**Section header:**
```
[H2] Services & Pricing
[Subtitle] Premium coaching, transparent pricing. No contracts, no commitments.
```

**Four pricing cards:**

| Card | Service | Price | Details | CTA |
|------|---------|-------|---------|-----|
| 1 (highlighted) | Movement Assessment | $125 | One-on-one, in-person. Laura evaluates how you move, identifies patterns, and gives you a clear action plan. 60 minutes. | Book Now |
| 2 | 4-Session Pack | $460 | Save $40. Four private sessions with Laura. Use within 8 weeks. Personalized programming included. | Get Started |
| 3 | 8-Session Pack | $840 | Save $160. Eight private sessions. Maximum results. Priority scheduling. | Get Started |
| 4 | Strong Lean Athletic | $149 | 12-week online program. Video-guided workouts, progressive programming. Train anywhere. | Learn More |

**Additional row below cards:**

```
[Accent text, centered]
FREE: Movement Readiness Assessment -- Take the 2-minute online quiz and discover your score.
[Button] Take the Free Quiz
```

**Card design:**
- Card 1 (Assessment) gets a Coral top border (4px) and a subtle "Most Popular" badge
- All cards: white surface, shadow, rounded corners 12px
- Price: large (36px), Charcoal, bold
- Service name: H3
- Details: body text small
- CTA button: Coral for Card 1, Charcoal outline for Cards 2-4

**Mobile:**
- Cards stack vertically
- Horizontal scroll carousel is an acceptable alternative if vertical stacking feels too long

**Button behavior:**
- "Book Now" and "Get Started" scroll to Section 8 (Inquiry Form)
- "Learn More" links to Trainerize product page (or scrolls to form with "SLA" pre-selected)
- "Take the Free Quiz" opens Tally quiz

---

### Section 7: SOCIAL PROOF / CONTENT

**Layout:** Background: Deep Turquoise (#1A7A7A). Text: White.

**Section header:**
```
[H2, white] See Laura in Action
[Subtitle, white/muted] Follow along on social media for daily movement tips, coaching insights, and Key West life.
```

**Content options (choose one at build time based on available content):**

**Option A: Instagram Feed Embed (preferred)**
- Embed latest 6-9 Instagram posts in a 3x3 or 3x2 grid
- Use Elfsight Instagram widget (Framer-compatible) or native embed
- Posts should link to Instagram when clicked
- If Laura's Instagram doesn't have enough polished posts at launch, use Option B

**Option B: Testimonial Carousel**
- 3-5 testimonial cards in a horizontal scroll/carousel
- Each card: quote text, client first name + one-line identifier (e.g., "Maria, 62, Key West")
- White cards on turquoise background
- Auto-advance every 5 seconds with manual navigation dots

**Option C: Hybrid**
- Left half: 2-3 stacked testimonial quotes
- Right half: Instagram embed (3 posts)

**Decision needed from Alex:** Which option? Does Laura have enough Instagram content for a 9-post grid? Do we have at least 3 testimonials (anonymized is fine)?

**Mobile:**
- Instagram grid: 3x3 stays but images are smaller
- Carousel: full-width swipe cards

---

### Section 8: INQUIRY FORM

**Layout:** Background: Warm White (#FAF7F2). Two columns on desktop.

**Section header:**
```
[H2] Ready to Move Better?
[Subtitle] Fill out the form below and Laura will personally respond within 24 hours.
```

**Left column (40%):**
- Quick bullets reinforcing value:
  - "No commitment required"
  - "In-person sessions in Key West"
  - "Online options available"
  - "All ages and fitness levels welcome"
- Small photo of Laura (casual, approachable)

**Right column (60%):**

Form fields:

| Field | Type | Required | Placeholder |
|-------|------|----------|-------------|
| First Name | Text | Yes | Your first name |
| Last Name | Text | Yes | Your last name |
| Phone | Tel | Yes | (305) 555-0123 |
| Email | Email | Yes | you@email.com |
| What brought you here? | Textarea | No | Tell me a bit about what you're looking for... |
| Submit | Button | -- | Send My Info |

**Form behavior:**
- Submit sends data to laura@lauratreto.com via Framer's native form handler or a connected service (Zapier, Make, or direct SMTP)
- On submit: show a success message -- "Thanks! Laura will be in touch within 24 hours."
- Consider also sending to Trainerize or Google Sheet for CRM tracking

**Form design:**
- Fields: clean borders, rounded (8px), comfortable padding (14px 16px)
- Focus state: Coral border
- Submit button: full-width Coral, white text, 48px height
- Error states: red border + inline error text below field

**Mobile:**
- Single column. Left column content stacks above the form.

**Spam prevention:**
- Honeypot field (hidden input) or Framer's built-in spam filtering
- No CAPTCHA (friction too high for this audience)

---

### Section 9: FOOTER

**Layout:** Background: Charcoal (#2B2B2B). Text: White / muted white.

**Content (three columns on desktop):**

| Column 1 | Column 2 | Column 3 |
|-----------|----------|----------|
| **Laura Treto** | **Follow Along** | **Contact** |
| Movement Coach | [TikTok icon + link] | laura@lauratreto.com |
| Key West, FL | [Instagram icon + link] | Key West, FL |
| | [Facebook icon + link] | |

**Bottom strip:**
```
[Small text, muted]
(c) 2026 Laura Treto Coaching. All rights reserved.     Built by Ainiko.ai
```

**Design details:**
- Social icons: white, 24px, hover state turns Coral
- "Built by Ainiko.ai" links to ainiko.ai (when live)
- Minimal footer -- no navigation links (single-page site, no need)
- Padding: 60px top/bottom

**Mobile:**
- Stack columns vertically, center-aligned

---

## 4. TECHNICAL REQUIREMENTS

### 4.1 Platform & Hosting

| Item | Detail |
|------|--------|
| Builder | Framer (framer.com) |
| Plan | Framer Mini or Basic plan ($5-15/mo) -- sufficient for single-page site |
| Hosting | Framer-managed (included in plan) |
| Domain | lauratreto.com -- custom domain connected via Framer |
| SSL | Automatic via Framer (Let's Encrypt) |

### 4.2 Domain Migration

Current state: lauratreto.com is registered and DNS is managed by Squarespace.

**Migration steps:**
1. In Squarespace: go to Domains > lauratreto.com > DNS Settings
2. Option A: Transfer domain to Framer (simplest long-term, takes 5-7 days)
3. Option B: Point DNS to Framer while keeping registration at Squarespace
   - Add CNAME record pointing to Framer's hosting
   - Framer provides exact DNS values during custom domain setup
4. Remove Squarespace noindex tag (it's currently blocking search engines)
5. Cancel Squarespace subscription after Framer is live (avoid double billing)

**Decision needed from Alex:** Transfer domain to Framer or keep at Squarespace and point DNS? Transfer is cleaner but takes longer.

### 4.3 Performance

| Metric | Target |
|--------|--------|
| First Contentful Paint | Under 1.5 seconds |
| Largest Contentful Paint | Under 3.0 seconds |
| Total page weight | Under 3MB |
| Image optimization | WebP format, lazy loading below the fold |
| Video (if used) | Compressed to under 3MB, MP4/H.265, poster image for instant display |

**Performance rules:**
- All images exported as WebP, max 1200px wide (2400px for hero/retina)
- Lazy load everything below the fold
- No external font loading beyond Google Fonts (Playfair Display + Inter are both on Google Fonts)
- Minimize third-party scripts (Instagram embed and analytics only)
- Test on 3G throttled connection before launch

### 4.4 SEO

| Item | Implementation |
|------|---------------|
| Title tag | Laura Treto -- Movement Coach, Key West FL |
| Meta description | World-class movement coaching in Key West. Founding Acosta Danza member, 1000+ performances. Private sessions for adults 45+. Book your assessment today. |
| OG image | Custom 1200x630 image: Laura's photo + name + tagline. For social sharing. |
| OG title | Laura Treto -- Movement Coaching, Key West |
| Schema markup | LocalBusiness schema (name, address, phone, services, priceRange) |
| Sitemap | Auto-generated by Framer |
| Robots | Remove noindex (currently blocking on Squarespace) |
| Canonical URL | https://lauratreto.com |

### 4.5 Analytics

| Tool | Purpose |
|------|---------|
| Framer Analytics | Built-in page views, visitor count (included in plan) |
| Google Analytics 4 | Full analytics: traffic sources, user behavior, conversions |
| Form tracking | Track form submissions as conversion events in GA4 |
| Quiz tracking | Track quiz starts and completions (via Tally analytics or UTM parameters) |

**Setup:** Add GA4 tag in Framer's custom code injection (site settings > head code).

### 4.6 Third-Party Integrations

| Integration | Purpose | Implementation |
|-------------|---------|---------------|
| Tally | Movement Readiness Score quiz | Embed via iframe or link to hosted Tally page |
| Elfsight | Instagram feed embed | Script embed in Section 7 |
| Google Fonts | Typography (Playfair Display, Inter) | Framer native or custom code |
| Google Analytics 4 | Analytics | Script in head |

**No other third-party scripts.** Keep it lean.

---

## 5. RESPONSIVE DESIGN SPECS

### Breakpoints

| Breakpoint | Width | Key Adjustments |
|------------|-------|-----------------|
| Desktop | 1280px+ | Full layout as designed, max content width 1200px |
| Tablet | 768px - 1279px | Two-column layouts collapse where needed, reduce padding |
| Mobile | 320px - 767px | Single column, stacked cards, smaller type per spec |

### Mobile-Specific Rules

1. **Hero:** Buttons stack vertically. Background image cropped to show Laura (use object-position to keep subject centered).
2. **Credential Bar:** 2x3 grid instead of horizontal row.
3. **Cards (Sections 3, 4, 6):** Stack vertically, full width.
4. **About (Section 5):** Photo on top, text below.
5. **Form (Section 8):** Full width, single column.
6. **Footer:** Stack columns, center-align text.
7. **Touch targets:** All buttons and links minimum 44px height.
8. **No horizontal scroll.** Test thoroughly.
9. **Font sizes:** Use mobile column from typography table.

---

## 6. ANIMATIONS & INTERACTIONS

Keep animations subtle and functional. This is a premium site, not a portfolio piece.

| Element | Animation | Trigger |
|---------|-----------|---------|
| Hero headline | Fade up (20px) + fade in | On page load, 0.3s delay |
| Hero buttons | Fade in | On page load, 0.5s delay |
| Credential bar items | Fade in, staggered 0.1s each | On scroll into view |
| Section headers (all) | Fade up (10px) + fade in | On scroll into view |
| Cards (Sections 3, 4, 6) | Fade up (15px) + fade in, staggered | On scroll into view |
| About section photo | Slight scale (1.02 to 1.0) + fade in | On scroll into view |
| Pricing cards | Subtle hover: lift 4px + shadow increase | On hover (desktop only) |
| CTA buttons | Background color darken 10% | On hover |
| Form submit | Button text changes to "Sending..." with spinner | On click |

**Rules:**
- All animations use ease-out curve
- Duration: 0.4-0.6s max
- No animation on mobile scroll (performance). Only fade-in on scroll is acceptable.
- No parallax effects
- No auto-playing carousels (except testimonial carousel if used, 5s interval with pause on hover)

---

## 7. COPY SOURCES

All website copy has been developed in the Laura Treto Coaching strategy documents. Do NOT rewrite copy -- adapt from these sources:

| Section | Copy Source |
|---------|------------|
| Hero headline + subhead | Defined in this spec (Section 3, Section 1) |
| Credential bar | Derived from CONTENT-ENGINE.md Section 10 (Bio Rewrites) |
| Who I Help cards | Derived from STRATEGY-ANSWERS.md Section 5 (positioning) and strategic recommendations |
| How It Works steps | Derived from LEAD-MAGNET-SPEC.md (funnel flow) |
| About Laura bio | CONTENT-ENGINE.md Section 10 (Bio Rewrites, Facebook long description) |
| Raul Malo testimonial | Confirm exact quote with Alex before publishing |
| Services & Pricing | STRATEGY-ANSWERS.md Section 4 (Trainerize pricing) |
| Form section | Standard inquiry form -- no special copy needed |
| CTAs | CONTENT-ENGINE.md Section 4 (CTA Framework) |

---

## 8. DESIGN REFERENCES

Framer templates and live sites that match the target aesthetic. Use these for inspiration during the build -- do not replicate directly.

### 8.1 Wellness / Coaching Templates

| Template | URL | Why It's Relevant |
|----------|-----|-------------------|
| **Serenya** | https://serenya.framer.website/ | Premium wellness coach template. Minimalist, high-conversion layout. Clean whitespace, testimonial integration, service showcase. Closest to our target feel. |
| **Mycoach** | https://www.framer.com/marketplace/templates/mycoach/ | Personal trainer Framer template. Energetic design, engaging animations. Good reference for coaching sections. |
| **Hermes** | https://hermes-template.framer.website/ | Fitness coaching template. Clean, modern design. Good reference for how to present programs and success stories. |

### 8.2 Dance / Performing Arts Templates

| Template | URL | Why It's Relevant |
|----------|-----|-------------------|
| **Dancer** | https://www.framer.com/marketplace/templates/dancer/ | Dance studio template. Photo-heavy, movement-focused. Good reference for hero treatments and visual storytelling. |
| **Danzora** | https://www.framer.com/marketplace/templates/danzora/ | Dance school template. Full customization of colors and typography. Reference for how to present a dance-background professional. |

### 8.3 Premium Personal Brand References

| Template | URL | Why It's Relevant |
|----------|-----|-------------------|
| **Ananda** | https://www.framer.com/marketplace/templates/ananda/ | Multi-layout yoga and coaching template. 12 pre-made pages, 44 sections. Premium feel, relaxing design. Good pricing section reference. |
| **FITHU** | https://www.framer.com/marketplace/templates/fithu/ | Free health template. Clean design, modern interactions, mobile-first. Good baseline reference for responsive behavior. |

### 8.4 Color Palette Inspiration

- **Framer color guide:** https://www.framer.com/blog/10-elegant-color-palettes-for-websites/ -- Reference for how to implement warm palettes in Framer specifically.
- Bambzi template palette (warm, inviting, upscale dining/event feel) is a close analog to our Key West sunset direction.

### Build Recommendation

Start from **Serenya** or build from blank canvas. Serenya gives the closest starting point (wellness coach, premium, clean) but may need significant restyling for the warm/exotic/spicy direction. Building from blank gives full control but takes longer.

**Recommended approach:** Start blank in Framer. Use Serenya and Dancer as visual references. Build mobile-first. The site is simple enough (9 sections, single page) that a template isn't strictly necessary and may cause more fighting-with-defaults than it saves.

---

## 9. BUILD TIMELINE

| Day | Date | Deliverable | Details |
|-----|------|-------------|---------|
| 1 | Fri, April 3 | Setup + Sections 1-3 | Create Framer account, set up project, define global styles (colors, fonts, spacing). Build Hero, Credential Bar, Who I Help. |
| 2 | Sat, April 4 | Sections 4-6 | Build How It Works, About Laura, Services & Pricing. Embed quiz link. |
| 3 | Sun, April 5 | Sections 7-9 + Mobile | Build Social Proof, Inquiry Form, Footer. Full mobile optimization pass. Test form submission. |
| 4 | Mon, April 6 | QA + Launch | Cross-browser testing (Chrome, Safari, Firefox). Mobile testing (iPhone, Android). Performance audit (Lighthouse). Connect domain if DNS is ready. Go live. |

### Pre-Build Checklist (before Day 1)

- [ ] Framer account created (free tier to start, upgrade when connecting domain)
- [ ] Laura's professional photos collected (minimum: 1 hero, 1 headshot, 1 coaching)
- [ ] Acosta Danza logo obtained (or decision to go text-only)
- [ ] Raul Malo quote confirmed and approved for public use
- [ ] Tally quiz built and hosted (from LEAD-MAGNET-SPEC.md)
- [ ] Laura's Instagram has enough content for embed (minimum 6 posts) OR testimonials collected
- [ ] GA4 property created for lauratreto.com
- [ ] Decision on domain migration approach (transfer vs. DNS point)

---

## 10. QUESTIONS FOR ALEX BEFORE BUILDING

These need answers before Day 1 to avoid blockers during the build.

### Must-Answer

1. **Hero background: photo or video?** Do we have footage of Laura in movement (dance or coaching) that could work as a looping background video? If not, we go with a still photo.

2. **Professional photos:** Do we have Laura's professional photos ready? We need at minimum:
   - 1 hero-quality image (full body, movement, high resolution)
   - 1 headshot/portrait for About section
   - 1 coaching/training image for How It Works or Services
   - 2-3 Key West landscape shots for background accents

3. **Acosta Danza logo:** Do we have permission to use their logo on the credential bar? If not, text-only works fine.

4. **Raul Malo testimonial:** Is the exact quote "Laura helped me walk again without pain"? Has this been approved for public use on a website? Given his passing in 2023, we want to be respectful. The current spec treats it tastefully (not the centerpiece, includes legacy note).

5. **Tally quiz:** Has the Movement Readiness Score quiz been built in Tally yet? If not, that needs to happen in parallel with the website build (refer to LEAD-MAGNET-SPEC.md for questions and scoring).

6. **Instagram content:** Does Laura have at least 6-9 polished posts on Instagram for the embed? If not, we'll use a testimonial carousel instead (need 3-5 testimonials).

### Should-Answer

7. **Domain migration:** Transfer lauratreto.com to Framer, or keep at Squarespace and point DNS? Transfer is cleaner but takes 5-7 days. Pointing DNS is instant once configured.

8. **Form destination:** Where should form submissions go? Options:
   - laura@lauratreto.com (simplest)
   - Trainerize notification
   - Google Sheet + email notification (best for tracking)
   - All of the above via Zapier/Make

9. **Framer plan:** Mini ($5/mo, 1 custom domain, basic analytics) or Basic ($15/mo, 2 custom domains, advanced analytics, password protection)? Mini is sufficient for launch.

10. **SLA product page:** The Strong Lean Athletic online program ($149) -- should "Learn More" link to Trainerize directly, or should we add a sub-page/section with more details on the Framer site?

### Nice-to-Know

11. **Additional testimonials:** Beyond Raul Malo, do we have any client testimonials (even anonymized)? Useful for Section 7.

12. **Laura's social links:** Confirm the exact TikTok, Instagram, and Facebook URLs for the footer.

13. **Ainiko.ai credit:** Is ainiko.ai live or coming soon? If not live, should the footer credit link anywhere or just be text?

---

## 11. POST-LAUNCH CHECKLIST

After the site goes live, these items need attention within the first week:

- [ ] Verify form submissions are being received at laura@lauratreto.com
- [ ] Test quiz embed on mobile (Tally responsiveness)
- [ ] Submit sitemap to Google Search Console
- [ ] Verify OG image renders correctly on Facebook, Twitter, LinkedIn (use opengraph.xyz to test)
- [ ] Set up GA4 conversion tracking for form submissions
- [ ] Remove Squarespace noindex tag if DNS is still pointing there during transition
- [ ] Run Lighthouse audit -- target 90+ on Performance, Accessibility, SEO
- [ ] Test on: iPhone Safari, Android Chrome, Desktop Chrome, Desktop Safari, Desktop Firefox
- [ ] Share URL with Laura for review and feedback
- [ ] Cancel Squarespace subscription once Framer site is confirmed live and stable

---

*Spec complete. Ready for build on Day 1 (April 3, 2026).*
*Builder: Max (MVP & Product Builder) | Reviewer: Alpha*
