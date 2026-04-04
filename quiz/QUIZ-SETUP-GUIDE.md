# Movement Readiness Quiz -- Setup Guide

## Overview

The quiz is built as a **self-contained HTML file** (`movement-readiness-quiz.html`) that can be:
- Embedded in Framer via iframe
- Hosted standalone on any static host (Netlify, Vercel, GitHub Pages)
- Opened locally for testing

No Tally needed. No backend needed. Everything runs client-side.

---

## File Location

```
quiz/
  movement-readiness-quiz.html   <-- The quiz (self-contained)
  QUIZ-SETUP-GUIDE.md            <-- This file
```

---

## Deployment Options

### Option A: Embed in Framer (Recommended)

1. Upload `movement-readiness-quiz.html` to a static host (Netlify is free and takes 30 seconds)
2. In Framer, go to the quiz page (`lauratreto.com/quiz`)
3. Add an **Embed** component (Code > Embed)
4. Paste: `<iframe src="https://YOUR-NETLIFY-URL/movement-readiness-quiz.html" width="100%" height="900" frameborder="0" style="border:none;"></iframe>`
5. Adjust height as needed (900px works for desktop; the quiz is responsive)
6. Publish

### Option B: Direct Page on Netlify

1. Create a Netlify site with just this HTML file
2. Set up a custom subdomain: `quiz.lauratreto.com`
3. Link from the main site: "Take the Quiz" button points to `quiz.lauratreto.com`

### Option C: Framer Native Rebuild

Once validated (50+ completions), rebuild the quiz natively in Framer for:
- Perfect design integration
- Faster load times
- No iframe quirks

---

## Quiz Questions Reference

All 7 questions are built into the HTML file. Here they are for reference:

### Q1: Overall Mobility
**"How would you rate your overall mobility?"**
- I move freely with no restrictions (15 pts)
- Some areas feel tight (10 pts)
- I feel stiff most of the time (5 pts)
- I avoid certain movements because of discomfort (0 pts)

### Q2: Single-Leg Balance
**"Can you stand on one leg for 30 seconds without wobbling?"**
- Easily, both sides (15 pts)
- One side yes, one side no (10 pts)
- I can for about 10-15 seconds (5 pts)
- I need to hold onto something (0 pts)

### Q3: Morning Stiffness
**"How often do you experience joint stiffness when waking up?"**
- Never (15 pts)
- Occasionally, goes away quickly (10 pts)
- Most mornings (5 pts)
- Every day, takes a while to loosen up (0 pts)

### Q4: Floor-to-Stand
**"Can you get up from the floor without using your hands?"**
- Easily (15 pts)
- With some effort (10 pts)
- Only with support (5 pts)
- I avoid getting on the floor (0 pts)

### Q5: Pain Interference
**"In the past month, has pain or discomfort stopped you from doing something you wanted to do?"**
- Never (15 pts)
- Once or twice (10 pts)
- Several times (5 pts)
- Regularly (0 pts)

### Q6: Physical Confidence
**"How confident are you in your body during physical activity?"**
- Very confident (15 pts)
- Mostly confident but careful (10 pts)
- Cautious -- I worry about injury (5 pts)
- I avoid most physical activity (0 pts)

### Q7: Primary Goal (no points -- tagging only)
**"What's your #1 goal right now?"**
- Move without pain (tag: pain_focus)
- Build strength I can feel (tag: strength_focus)
- Improve balance and stability (tag: balance_focus)
- Feel confident in my body again (tag: confidence_focus)

---

## Scoring Logic

- **Questions 1-6:** 15 points each = 90 max raw
- **Formula:** `(raw / 90) * 100` rounded to nearest whole number
- **Q7** does not affect score; used for email segmentation

### Score Tiers

| Score | Tier | Color |
|-------|------|-------|
| 85-100 | Movement Strong | Green |
| 60-84 | Movement Ready | Gold |
| 40-59 | Movement Rebuilder | Orange |
| 0-39 | Movement Priority | Red |

---

## ConvertKit Integration

The HTML file has a commented-out ConvertKit API integration in the `submitEmail()` function. To activate:

1. Create a ConvertKit account (free up to 10,000 subscribers)
2. Create a form in ConvertKit (Settings > Forms > New Form)
3. Get your **Form ID** and **Public API Key**
4. In the HTML file, find the `submitEmail` function
5. Uncomment the fetch block
6. Replace `YOUR_FORM_ID` and `YOUR_PUBLIC_API_KEY`
7. Set up custom fields in ConvertKit: `score`, `tier`, `goal_tag`, `weakest_areas`
8. Create tags for each tier (see Email Setup Guide)

### Data Passed to ConvertKit

| Field | Example Value | Purpose |
|-------|---------------|---------|
| email | user@email.com | Contact |
| first_name | Jane | Personalization |
| score | 62 | Segmentation |
| tier | Movement Ready | Email content |
| goal_tag | balance_focus | Personalization |
| weakest_areas | balance,stiffness,pain | Targeted recs |

---

## Testing Checklist

- [ ] Open HTML file locally in browser
- [ ] Complete quiz with all high answers (expect 100, Movement Strong)
- [ ] Complete quiz with all low answers (expect 0, Movement Priority)
- [ ] Complete quiz with mixed answers (verify math)
- [ ] Test on mobile (responsive layout)
- [ ] Verify Back button works on every question
- [ ] Verify progress bar updates correctly
- [ ] Check that recommendations match weakest areas
- [ ] Test email form submission (currently shows success without backend)
- [ ] Verify score meter arc animates correctly
- [ ] Test in iframe context (no overflow, no scroll issues)
