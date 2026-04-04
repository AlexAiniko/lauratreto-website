# Lead Magnet Specification: Movement Readiness Score

**Free Online Assessment — Funnel Entry Point**

---

## Overview

| Field | Detail |
|-------|--------|
| Name | Movement Readiness Score |
| Format | Web-based quiz (5-7 questions) |
| Time to complete | Under 2 minutes |
| Output | Personalized score (1-100) + tailored recommendations |
| Location | Dedicated page on Framer website (lauratreto.com/quiz) |
| Primary CTA | Book a movement assessment ($125) |
| Secondary CTA | Email capture for nurture sequence |

---

## Why This Works

1. **Low friction.** No video, no camera, no awkward movement tests. Just answer 7 questions.
2. **Creates self-awareness.** Most people don't know they have a balance problem until a quiz tells them. That gap between "I thought I was fine" and "apparently I'm a 52" is where motivation lives.
3. **Gives Laura a reason to follow up.** "I saw your score — here's what I'd work on" is a warm, helpful opening, not a cold pitch.
4. **Captures email + name.** Every quiz-taker enters the nurture funnel.
5. **Positions Laura as the expert.** The assessment itself IS the product demo. If the quiz is this good, what's a real session like?
6. **Market research built in.** Laura learns what her audience struggles with most (balance? stiffness? confidence?) and can tailor content and offers accordingly.

---

## The 7 Questions

### Q1: Overall Mobility Self-Assessment

**"How would you rate your overall mobility?"**

| Option | Points |
|--------|--------|
| I move freely with no restrictions | 15 |
| Some areas feel tight | 10 |
| I feel stiff most of the time | 5 |
| I avoid certain movements because of discomfort | 0 |

---

### Q2: Single-Leg Balance Test

**"Can you stand on one leg for 30 seconds without wobbling?"**

| Option | Points |
|--------|--------|
| Easily, both sides | 15 |
| One side yes, one side no | 10 |
| I can for about 10-15 seconds | 5 |
| I need to hold onto something | 0 |

---

### Q3: Morning Stiffness Frequency

**"How often do you experience joint stiffness when waking up?"**

| Option | Points |
|--------|--------|
| Never | 15 |
| Occasionally, goes away quickly | 10 |
| Most mornings | 5 |
| Every day, takes a while to loosen up | 0 |

---

### Q4: Floor-to-Stand Test

**"Can you get up from the floor without using your hands?"**

| Option | Points |
|--------|--------|
| Easily | 15 |
| With some effort | 10 |
| Only with support | 5 |
| I avoid getting on the floor | 0 |

---

### Q5: Pain Interference

**"In the past month, has pain or discomfort stopped you from doing something you wanted to do?"**

| Option | Points |
|--------|--------|
| Never | 15 |
| Once or twice | 10 |
| Several times | 5 |
| Regularly | 0 |

---

### Q6: Physical Confidence

**"How confident are you in your body during physical activity?"**

| Option | Points |
|--------|--------|
| Very confident | 15 |
| Mostly confident but careful | 10 |
| Cautious — I worry about injury | 5 |
| I avoid most physical activity | 0 |

---

### Q7: Primary Goal (Qualitative — No Points)

**"What's your #1 goal right now?"**

| Option | Tag |
|--------|-----|
| Move without pain | pain_focus |
| Build strength I can feel | strength_focus |
| Improve balance and stability | balance_focus |
| Feel confident in my body again | confidence_focus |

*Q7 does not affect the numerical score. It tags the user for personalized recommendations and email segmentation.*

---

## Scoring Logic

**Total possible: 90 points (Q1-Q6, 15 each). Normalized to 100-point scale.**

Formula: `(raw_score / 90) * 100`, rounded to nearest whole number.

### Score Ranges and Results

---

**85-100: Movement Strong**

> Your body is working well. You have strong mobility, good balance, and minimal limitations. Private coaching can take you from good to exceptional — refining movement quality, building longevity, and unlocking performance you didn't know you had.

Recommendation emphasis: optimization, longevity, peak performance.

---

**60-84: Movement Ready**

> You have a solid foundation but there are gaps. Maybe one side is tighter than the other, or balance isn't what it used to be. A targeted assessment would reveal exactly where to focus so you can train smarter, not just harder.

Recommendation emphasis: identifying asymmetries, targeted mobility work, building consistency.

---

**40-59: Movement Rebuilder**

> Your body is asking for attention. Stiffness, instability, or discomfort are showing up in ways that limit what you can do. You're in the perfect position to make dramatic improvements with guided coaching — small, targeted changes can transform how you feel within weeks.

Recommendation emphasis: foundational movement patterns, joint health, progressive loading.

---

**Below 40: Movement Starter**

> This is your starting line -- and that's a great place to be. Your score tells me there's a lot of room for improvement, and the people who start here often see the biggest changes the fastest. You don't need to be fit to begin. You just need someone who knows how to meet you where you are. I'd love to help.

Recommendation emphasis: gentle re-introduction to movement, pain-free range exploration, confidence building.

---

## Results Page Design

### Layout (top to bottom):

1. **Score Display**
   - Large number (e.g., "Your Movement Readiness Score: 62")
   - Visual meter/arc showing where they fall (color-coded: green/yellow/orange/red)
   - Category label (e.g., "Movement Ready")

2. **Personalized Recommendations (2-3 bullets)**
   - Generated based on which questions scored lowest
   - Example for someone who scored 0 on Q2 and 5 on Q4:
     - "Your balance needs attention — single-leg stability is a key indicator of fall risk and joint health."
     - "Floor-to-stand mobility is limited. This affects everything from playing with grandkids to getting out of a car."
   - Each recommendation includes one actionable tip Laura provides for free

3. **Primary CTA: Book an Assessment**
   - "Want to know exactly what's going on? I do private movement assessments right here in Key West. In 60 minutes I'll map your movement, find the gaps, and give you a clear plan."
   - Button: "Book Your Assessment ($125)"
   - Links to booking page

4. **Secondary CTA: Free Email Guide**
   - "Not ready to book? Get my free 5-day movement guide — one exercise per day based on your score range."
   - Email capture field (name + email)
   - Button: "Send Me the Guide"

5. **Credential Bar (bottom of page)**
   - Acosta Danza founding member | O-1B visa holder | 1,000+ performances | NASM CPT
   - Small headshot of Laura

---

## Email Capture and Nurture Sequence

### Trigger
User enters email on the results page (either CTA).

### Data Captured
- Name
- Email
- Score (number)
- Score range (Movement Strong / Ready / Rebuilder / Starter)
- Goal tag from Q7 (pain_focus / strength_focus / balance_focus / confidence_focus)
- Weakest areas (which questions scored lowest)

---

### Email Sequence (5 Emails Over 10 Days)

**Email 1 — Immediate (auto-send on quiz completion)**
Subject: "Your Movement Readiness Score: [X]"

Content:
- Recap their score and what it means
- 1-2 personalized insights based on weakest questions
- "Over the next few days I'll send you specific tips based on your results."
- Sign-off: Laura (warm, personal, not corporate)

---

**Email 2 — Day 2**
Subject: "The #1 thing I'd work on based on your score"

Content:
- Personalized by score range:
  - Movement Strong: "You're ahead of most people. Here's how to stay there..." (longevity focus)
  - Movement Ready: "Your [weakest area] is the bottleneck. Here's a simple drill..." (specific exercise)
  - Movement Rebuilder: "Start here — this one movement pattern changes everything..." (foundational drill)
  - Movement Starter: "Forget what you think 'exercise' has to look like. Start with this..." (gentle entry point)
- Include a short video or GIF of Laura demonstrating the drill (filmed on iPhone, authentic, not polished)

---

**Email 3 — Day 4**
Subject: "How I went from performing 1,000 shows to coaching movement"

Content:
- Laura's story: Acosta Danza, touring the world, the transition to coaching
- Why she cares about everyday people moving well (not just athletes)
- The psychology angle: how confidence in your body changes everything
- Subtle credibility building without bragging
- "I moved to Key West to build something personal and meaningful. That's what my coaching is."

---

**Email 4 — Day 7**
Subject: "What actually happens in a session with me"

Content:
- Walk through the assessment experience step by step
- What Laura looks at, what she tests, what the client walks away with
- Address objections:
  - "You don't need to be fit to start"
  - "It's not a workout — it's a conversation with your body"
  - "Most clients say they learned more in 60 minutes than in years of gym memberships"
- CTA: "Book your assessment" button

---

**Email 5 — Day 10**
Subject: "Your score was [X] — here's a free exercise to improve it"

Content:
- One specific exercise targeting their weakest scored area
- Video of Laura demonstrating (30-60 seconds)
- "This is one drill from dozens I use with clients. If you want the full picture, let's do an assessment."
- Soft CTA: booking link
- P.S. "Reply to this email if you have questions — I read every one."

---

## Technical Build Specification

### Option A: Typeform / Tally (Fastest to Launch)

| Component | Tool | Notes |
|-----------|------|-------|
| Quiz | Typeform or Tally | Free tier works. Tally preferred (no branding on free tier) |
| Email | ConvertKit (free up to 1,000 subs) or Mailchimp | ConvertKit preferred for creator workflows |
| Integration | Zapier or direct webhook | Quiz completion triggers email sequence |
| Scoring | Calculated in Typeform/Tally or via Zapier | Map answers to point values, sum, normalize |
| Results page | Custom thank-you page on Framer | Tally redirects to lauratreto.com/results |

### Option B: Custom Build on Framer (Best Experience)

| Component | Approach | Notes |
|-----------|----------|-------|
| Quiz UI | Built directly in Framer as a multi-step form | Matches site design perfectly |
| Scoring | Client-side JavaScript | Calculate score on completion, no backend needed |
| Results | Dynamic results page on Framer | Show score, recommendations, CTAs |
| Email capture | ConvertKit embed or Framer form → webhook | Passes score + tags to email tool |
| Email sequence | ConvertKit automation | Triggered by form submission with score data |

### Recommendation
Start with **Option A** (Tally + ConvertKit + Zapier). Get it live in under a week. Migrate to Option B when the quiz is validated and Laura has her first 50+ completions.

---

## Content Integration Plan

### Social Media CTAs (all drive to quiz)

- Bio link: "Take the free Movement Readiness Quiz" (primary link-in-bio destination)
- Reel CTA: "Think you move well? Take the 2-minute test — link in bio."
- Story CTA: "I made a free quiz that tells you exactly where your body needs work. Swipe up / link in bio."
- Post CTA: "Your Movement Readiness Score might surprise you. Link in bio to find out."

### Quiz Promotion Content Ideas

1. "I scored myself on my own quiz. Here's what happened." (Reel — Laura takes the quiz on camera)
2. "Can you do this? If not, your Movement Readiness Score might be lower than you think." (Reel — Laura demos the floor-to-stand test)
3. "The 30-second test that predicts your fall risk." (Reel — single-leg balance, educational hook)
4. "Most people score between 40-60. Where do you land?" (Story poll driving to quiz)
5. "I built this quiz based on what I assess in every private client session." (Carousel — behind-the-scenes of the assessment)

### Shareability

- Results page designed to be screenshot-worthy
- Score displayed as a clean visual card (number + color + category)
- Encourage sharing: "Share your score in your story and tag me — I'll send you a bonus tip"

---

## Success Metrics

| Metric | Target (first 90 days) |
|--------|----------------------|
| Quiz completions | 200+ |
| Email capture rate | 60%+ of completions |
| Email open rate | 40%+ (sequence average) |
| Assessment bookings from quiz | 10+ |
| Cost | $0 (free tiers of all tools) |

---

## Who Builds What

| Component | Owner | Notes |
|-----------|-------|-------|
| Quiz tech build (Tally/Framer, scoring logic, integrations) | **Kai** (dev agent) | Full quiz UI, JavaScript scoring, Zapier/webhook connections, ConvertKit setup |
| Exercise content (drills, demos, video scripts) | **Laura** | Laura films all exercise demos, writes movement cues, provides the clinical expertise |
| Email sequence copywriting | **Content team** (using specs above) | Laura reviews for voice and accuracy |
| Automation (email triggers, ManyChat, score routing) | **Kai** | ConvertKit automations, Zapier flows, ManyChat integration |
| Results page design | **Kai** (or Max if Framer) | Dynamic results display, CTA buttons, credential bar |
| Ongoing quiz maintenance | **Automation** | Score delivery, email sequences, and lead capture run automatically once built |

**Key principle:** Kai handles all technology. Laura provides all content and exercise expertise. Automation handles delivery after launch. Laura never needs to touch code or integrations.

---

## Next Steps to Launch

1. **Write quiz copy** (done — see questions above)
2. **Build quiz in Tally** (Kai, 1-2 hours)
3. **Set up ConvertKit account** (Laura, 30 minutes)
4. **Write 5 nurture emails** (content team, using specs above)
5. **Build results page on Framer** (Kai or Max, 2-3 hours)
6. **Connect Tally -> ConvertKit via Zapier** (Kai, 30 minutes)
7. **Test full flow** (Laura takes quiz, verifies emails arrive)
8. **Update link-in-bio to point to quiz**
9. **Launch first quiz-promotion Reel**

---

*Last updated: April 2, 2026*
