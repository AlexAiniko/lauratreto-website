# Laura Treto Coaching -- Design System

**Reference for Framer build. Colors, typography, spacing, components.**

---

## 1. COLOR PALETTE

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Coral** | `#E8654A` | 232, 101, 74 | Primary accent. All CTAs, buttons, hover states, interactive elements. |
| **Deep Turquoise** | `#1A7A7A` | 26, 122, 122 | Secondary accent. Credential bar, social proof section, trust elements. |
| **Warm White** | `#FAF7F2` | 250, 247, 242 | Default page background. Card backgrounds. |
| **Clean White** | `#FFFFFF` | 255, 255, 255 | Text on dark sections. Card surfaces. |
| **Charcoal** | `#2B2B2B` | 43, 43, 43 | Body text, headings on light backgrounds. Footer background. |
| **Gold** | `#C5973E` | 197, 151, 62 | Subtle accents, step numbers, decorative dividers, icons. |
| **Soft Sand** | `#F0E6D8` | 240, 230, 216 | Alternate section backgrounds for visual rhythm. |

### Color Rules
- NEVER use pure black (`#000000`). Use Charcoal for all dark text.
- Coral = action color. Every CTA, every button, every interactive element.
- Turquoise = trust color. Credentials, testimonials, authority sections.
- Alternate section backgrounds: Warm White -> Soft Sand -> Warm White -> Soft Sand.
- Gold is decorative only -- never for body text or backgrounds.

### Button States

| State | Background | Text | Border |
|-------|-----------|------|--------|
| Primary default | `#E8654A` | `#FFFFFF` | none |
| Primary hover | `#D4553B` (10% darker) | `#FFFFFF` | none |
| Secondary default | transparent | `#2B2B2B` | 2px `#2B2B2B` |
| Secondary hover | `#2B2B2B` | `#FFFFFF` | 2px `#2B2B2B` |
| Hero outline | transparent | `#FFFFFF` | 2px `#FFFFFF` |
| Hero outline hover | `rgba(255,255,255,0.15)` | `#FFFFFF` | 2px `#FFFFFF` |

---

## 2. TYPOGRAPHY

### Font Stack

| Role | Font Family | Google Fonts Import |
|------|------------|-------------------|
| Serif (headlines) | Playfair Display | `family=Playfair+Display:wght@600;700` |
| Sans-serif (body) | DM Sans | `family=DM+Sans:wght@400;500;600` |

**Google Fonts URL:**
```
https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap
```

### Type Scale

| Role | Font | Weight | Desktop | Mobile | Line Height | Letter Spacing |
|------|------|--------|---------|--------|-------------|---------------|
| H1 (Hero) | Playfair Display | 700 | 56px | 36px | 1.15 | -0.02em |
| H2 (Section) | Playfair Display | 600 | 40px | 28px | 1.2 | -0.01em |
| H3 (Card) | DM Sans | 600 | 24px | 20px | 1.3 | 0 |
| Body | DM Sans | 400 | 17px | 16px | 1.6 | 0 |
| Body Small | DM Sans | 400 | 15px | 14px | 1.5 | 0 |
| Button | DM Sans | 600 | 16px | 15px | 1 | 0.02em |
| Caption/Label | DM Sans | 500 | 13px | 12px | 1.4 | 0.1em |
| Step Number | Playfair Display | 700 | 48px | 36px | 1 | 0 |

### Typography Rules
- Playfair Display is ONLY for H1, H2, and decorative step numbers.
- DM Sans for everything else.
- Max body text width: 680px (readability).
- Captions/labels: uppercase, letter-spacing 0.1em.
- Never use font weights below 400 or above 700.

---

## 3. SPACING SYSTEM

### Base Unit: 8px

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Tight gaps, inline spacing |
| `--space-sm` | 8px | Icon-to-text gaps |
| `--space-md` | 16px | Card padding inner, mobile card gaps |
| `--space-lg` | 24px | Between elements within a section |
| `--space-xl` | 32px | Card padding |
| `--space-2xl` | 48px | Between section header and content |
| `--space-3xl` | 64px | Section top/bottom padding (mobile) |
| `--space-4xl` | 96px | Section top/bottom padding (desktop) |
| `--space-5xl` | 120px | Hero vertical padding |

### Section Padding
- Desktop: 96px top, 96px bottom
- Mobile: 64px top, 64px bottom
- Hero: full viewport height (100vh)
- Footer: 60px top, 60px bottom

### Content Width
- Max content width: 1200px
- Content padding (sides): 24px mobile, 40px tablet, 0 desktop (centered)
- Card grid gap: 24px desktop, 16px mobile

---

## 4. COMPONENT SPECS

### Cards (Sections 3, 4, 6)
```
Background:      #FFFFFF
Border radius:   12px
Padding:         32px
Shadow:          0px 4px 20px rgba(0, 0, 0, 0.06)
Hover shadow:    0px 8px 30px rgba(0, 0, 0, 0.10)  (desktop only)
Hover transform: translateY(-4px)  (desktop only)
Transition:      all 0.3s ease-out
```

### Pricing Card (Highlighted -- Card 1)
```
All card styles above PLUS:
Border top:      4px solid #E8654A
Badge:           "Most Popular" -- background #E8654A, text white,
                 font DM Sans 500, 12px, uppercase, padding 4px 12px,
                 border-radius 20px, positioned top-right of card
```

### Buttons
```
Height:          48px
Padding:         0 32px
Border radius:   8px
Font:            DM Sans 600, 16px
Transition:      all 0.2s ease-out
Cursor:          pointer

Full-width (form submit):
Width:           100%
```

### Form Fields
```
Background:      #FFFFFF
Border:          1px solid #D4D0CB
Border radius:   8px
Padding:         14px 16px
Font:            DM Sans 400, 16px
Focus border:    2px solid #E8654A
Focus shadow:    0 0 0 3px rgba(232, 101, 74, 0.15)
Error border:    2px solid #D94F4F
Placeholder:     color #999
```

### Credential Bar Items
```
Icon size:       28px, color #FFFFFF
Text:            DM Sans 500, 13px, uppercase, letter-spacing 0.1em, #FFFFFF
Divider:         1px solid rgba(255,255,255,0.2) (between items)
```

### Testimonial Block
```
Quotation mark:  Playfair Display, 60px, #C5973E, decorative (opacity 0.4)
Quote text:      Playfair Display italic, 22px, #2B2B2B
Attribution:     DM Sans 400, 15px, #777
```

---

## 5. RESPONSIVE BREAKPOINTS

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Desktop | 1280px+ | Full layouts, max content 1200px, hover states active |
| Tablet | 768px - 1279px | 2-column where applicable, reduced padding |
| Mobile | 320px - 767px | Single column, stacked cards, mobile type scale |

### Mobile-Specific Rules
- Hero buttons: stack vertically, full width
- Credential bar: 2 columns x 3 rows
- All card sections: stack vertically, full width
- About section: photo above text
- Form: single column
- Footer: stacked, center-aligned
- Touch targets: minimum 44px height
- No horizontal scroll
- No parallax
- Reduce animations (fade-in on scroll only)

---

## 6. ANIMATIONS

| Element | Type | Duration | Delay | Easing |
|---------|------|----------|-------|--------|
| Hero headline | Fade up 20px | 0.6s | 0.3s | ease-out |
| Hero buttons | Fade in | 0.4s | 0.5s | ease-out |
| Credential items | Fade in, stagger 0.1s | 0.4s | on scroll | ease-out |
| Section headers | Fade up 10px | 0.5s | on scroll | ease-out |
| Cards | Fade up 15px, stagger 0.15s | 0.5s | on scroll | ease-out |
| About photo | Scale 1.02 to 1.0 + fade | 0.6s | on scroll | ease-out |
| Pricing hover | Lift 4px + shadow increase | 0.3s | on hover | ease-out |
| Buttons | Background darken 10% | 0.2s | on hover | ease-out |

### Animation Rules
- All ease-out
- Max duration: 0.6s
- Mobile: only fade-in on scroll. No transforms, no parallax.
- No auto-playing carousels except testimonial (5s interval, pause on hover)

---

## 7. SEO METADATA

```html
<title>Laura Treto -- Movement Coach, Key West FL</title>
<meta name="description" content="World-class movement coaching in Key West. Founding Acosta Danza member, 1000+ performances. Private sessions for adults 45+. Book your assessment today." />
<meta property="og:title" content="Laura Treto -- Movement Coaching, Key West" />
<meta property="og:description" content="World-class movement coaching in Key West. Founding Acosta Danza member, 1000+ performances. Private sessions for adults 45+." />
<meta property="og:image" content="[OG-IMAGE-URL-1200x630]" />
<meta property="og:url" content="https://lauratreto.com" />
<link rel="canonical" href="https://lauratreto.com" />
```

---

*Design system complete. Use as reference during Framer build.*
