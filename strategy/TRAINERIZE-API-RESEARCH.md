# Trainerize API & Integration Research

**Date:** 2026-04-05
**Researcher:** Romy (Senior Researcher)
**Purpose:** Evaluate Trainerize API for booking/scheduling integration on lauratreto.com

---

## 1. Does Trainerize Have a Public API?

**Yes, but it is gated behind the most expensive plan.**

- API access is only available on the **Studio Plus plan** ($248/month per location).
- Laura is likely on a Grow ($9/mo) or Pro ($23/mo) plan with 2-5 clients.
- There is no standalone developer plan or free API tier.
- No public API documentation URL exists. Trainerize provides docs only after you have API access on Studio Plus.
- Base URL appears to be `api.trainerize.com/v03/` based on third-party code, but this is undocumented publicly.
- Trainerize Support explicitly states they do not help with API implementation. They refer you to third-party developers or their partner "Fitness Marketing Machine."

**Verdict: API is not viable for Laura's current plan or budget.**

---

## 2. API Technical Details (What Is Known)

| Detail | Status |
|--------|--------|
| Authentication | API Key (obtained in Trainerize settings, Studio Plus only) |
| OAuth | Mentioned on some tracker sites, unconfirmed |
| Endpoints | User lists, workout lists, body stats, nutrition, meal plans (from third-party code) |
| Booking/Scheduling endpoints | Not confirmed in public sources |
| Rate limits | Undocumented |
| SDK / npm / pip packages | None exist |
| OpenAPI/Swagger spec | Reportedly available (Studio Plus only) |
| Webhooks | Available, details undocumented publicly |
| GitHub repos | 4 repos, all forks/interview projects, no API SDK |

---

## 3. Zapier Integration (Available on Grow Plan and Above)

Zapier works on Laura's plan tier and provides:

**Triggers (events that fire):**
- New Client created
- New Purchase
- Tag Added to Client
- Cardio/Habit/Workout Completed
- Weight/Nutrition Goal Hit
- Product Start/End
- Auto-Renew Cancelled

**Actions (things you can do):**
- Activate/Deactivate Client
- Assign Client to Trainer
- Add Client to Group
- Copy Master Program to Client
- Subscribe/Unsubscribe from Programs
- Find Client (by email)

**What Zapier cannot do:**
- Create/manage appointments or bookings
- Access the calendar or scheduling
- Create checkout sessions
- Embed anything on a website

**Verdict: Zapier is useful for CRM automation (new client workflows, tagging), but not for booking integration on the website.**

---

## 4. Website Integration Methods (Available Now)

### Option A: Checkout Links (Recommended)
Every Trainerize product (session pack, program, assessment) generates a unique **checkout link**. These can be placed as buttons on lauratreto.com.

**How it works:**
1. Laura creates products in Trainerize (Movement Assessment $125, 4-Pack $460, etc.)
2. Each product gets a checkout URL
3. We add "Book Now" / "Buy Now" buttons on the website that link to these checkout pages
4. Client pays on the Trainerize/Stripe checkout page
5. Client is auto-added to Trainerize with correct program/trainer assigned

**Pros:** Simple, no API needed, works on any plan with Stripe Integrated Payments add-on ($25/mo)
**Cons:** Client leaves lauratreto.com to complete purchase (redirect, not embedded)

### Option B: Prospect Booking Page (Business Add-on)
The **Trainerize Business add-on** ($25/mo) provides:
- Custom prospect booking page with scheduling
- "Book a Consultation" button on Trainerize.me profile
- Automated confirmations and reminders
- Custom referral links that direct to booking pages

**How it works:**
1. Laura gets the Business add-on
2. A custom booking page URL is generated
3. We link the website CTA buttons to this booking page
4. Prospects book directly, get auto-reminders

**Pros:** Purpose-built for exactly what Laura needs, professional booking flow
**Cons:** Client still leaves lauratreto.com (redirect to Trainerize-hosted page)

### Option C: iframe Embed (Workaround)
Community workaround: embed Trainerize.me profile or booking page in an iframe.

```html
<iframe src="https://[username].trainerize.me" style="width:100%; height:600px;" frameborder="0"></iframe>
```

**Pros:** Keeps user on lauratreto.com visually
**Cons:** Trainerize has not officially endorsed this. May break, look janky, or have auth issues. Not recommended for production.

### Option D: Trainerize.me Profile
Trainerize provides a free profile page at trainerize.me where Laura can:
- List services and products
- Accept purchases
- Show credentials
- Link social media

**Pros:** Free, zero setup
**Cons:** Generic design, not Laura's brand, duplicate web presence

---

## 5. What Other Fitness Coaches Do

Based on research, the most common integration pattern is:

1. **Own website** for branding, content, credibility, SEO
2. **CTA buttons** that link to Trainerize checkout pages or booking pages
3. **Trainerize app** for ongoing client management, workouts, messaging
4. **Zapier** for automating new-client onboarding (email sequences, tagging, etc.)

Nobody embeds Trainerize directly into their website. The standard practice is clean handoff via buttons.

---

## 6. Recommendation for Laura

### Immediate (This Week)
**Use Checkout Links.** This requires zero API access and works on her current plan.

1. Create products in Trainerize for each service (Movement Assessment, 4-Pack, 8-Pack, SLA Program)
2. Connect Stripe for payments (Stripe Integrated Payments add-on, $25/mo)
3. Copy checkout URLs for each product
4. Add styled CTA buttons on lauratreto.com that link to these URLs
5. Flow: Visitor clicks "Book Assessment" on website -> Trainerize checkout page -> pays -> auto-onboarded

### Short-Term (Month 2-3)
**Add the Business Add-on** ($25/mo) when Laura has 5+ clients and needs proper scheduling.

- Gets prospect booking pages with calendar availability
- Automated confirmations/reminders reduce no-shows
- Referral tracking for word-of-mouth growth

### Not Recommended
- **API access** ($248/mo Studio Plus): Way too expensive for current stage. Revisit only if Laura scales to 50+ clients.
- **iframe embed**: Fragile, unsupported, unprofessional.
- **Building custom booking from scratch**: Over-engineering. Trainerize already handles payments, scheduling, and client management.

### Website Implementation
The website buttons should follow this pattern:

| Button | Links To |
|--------|----------|
| "Book Free Assessment" | Trainerize checkout link for Movement Assessment (or booking page with Business add-on) |
| "Start SLA Program" | Trainerize checkout link for Strong Lean Athletic |
| "View Packages" | Trainerize.me profile or dedicated pricing section |
| "Take the Quiz" | Movement Quiz (separate, on lauratreto.com) |

---

## Sources

- [Trainerize Pricing](https://www.trainerize.com/pricing/)
- [Trainerize API & Webhooks Help Article](https://help.trainerize.com/hc/en-us/articles/37082084919060-Using-API-and-Webhooks-With-ABC-Trainerize)
- [Trainerize API Tracker Profile](https://apitracker.io/a/trainerize)
- [Trainerize Business Add-on](https://www.trainerize.com/blog/introducing-abc-trainerize-business-add-on/)
- [Trainerize Booking Update](https://www.trainerize.com/blog/trainerize-update-give-clients-the-flexibility-to-book-their-own-appointments-and-sessions-in-trainerize/)
- [ABC Trainerize Zapier Integrations](https://zapier.com/apps/abc-trainerize/integrations)
- [Adding Products to Website (Wix)](https://help.trainerize.com/hc/en-us/articles/360038972912-Website-Adding-Stripe-Integrated-Payments-products-to-your-Wix-website)
- [Embedding Trainerize Idea Forum](https://ideas.trainerize.com/forums/167887-fitness-training-nutrition-and-habits/suggestions/12574143-embedding-into-existing-website)
- [Trainerize GitHub Organization](https://github.com/Trainerize)
- [How to Integrate Website with Trainerize](https://help.trainerize.com/hc/en-us/articles/360038736812-How-to-Advertise-and-Sell-Products-Using-Your-Website)
