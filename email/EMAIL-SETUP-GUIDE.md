# Email Setup Guide -- Movement Readiness Funnel

## ConvertKit Account Setup

### Step 1: Create Account
1. Go to [kit.com](https://kit.com) (formerly ConvertKit)
2. Sign up for the free plan (up to 10,000 subscribers)
3. Confirm email, set up profile

### Step 2: Create Custom Fields
Go to **Subscribers > Custom Fields** and create:

| Field Name | Type | Purpose |
|-----------|------|---------|
| score | Number | Movement Readiness Score (0-100) |
| tier | Text | Movement Strong / Ready / Rebuilder / Priority |
| goal_tag | Text | pain_focus / strength_focus / balance_focus / confidence_focus |
| weakest_areas | Text | Comma-separated weak areas |

### Step 3: Create Tags
Go to **Subscribers > Tags** and create:

| Tag Name | Applied When |
|----------|-------------|
| movement-strong | Score 85-100 |
| movement-ready | Score 60-84 |
| movement-rebuilder | Score 40-59 |
| movement-priority | Score 0-39 |
| pain_focus | Q7 answer: Move without pain |
| strength_focus | Q7 answer: Build strength |
| balance_focus | Q7 answer: Improve balance |
| confidence_focus | Q7 answer: Feel confident |

### Step 4: Create Segments
Go to **Subscribers > Segments** and create:

| Segment | Filter |
|---------|--------|
| Strong Movers | Tag = movement-strong |
| Ready Movers | Tag = movement-ready |
| Rebuilders | Tag = movement-rebuilder |
| Priority Movers | Tag = movement-priority |

### Step 5: Create a Form
1. Go to **Grow > Landing Pages & Forms**
2. Create a new **Form** (inline type)
3. Name it "Movement Readiness Quiz"
4. You won't actually embed this form -- it's just the endpoint for the API
5. Note the **Form ID** from the URL (e.g., `https://app.kit.com/forms/designers/123456` -- the ID is `123456`)

### Step 6: Get API Key
1. Go to **Settings > Advanced > API**
2. Copy the **API Key** (public key)
3. This goes into the quiz HTML file

---

## Quiz-to-ConvertKit Integration

The quiz HTML submits to ConvertKit via their v3 API. In `movement-readiness-quiz.html`, update the `submitEmail` function:

```javascript
const CK_FORM_ID = '123456';        // Your form ID
const CK_API_KEY = 'your_api_key';  // Your public API key

fetch(`https://api.convertkit.com/v3/forms/${CK_FORM_ID}/subscribe`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    api_key: CK_API_KEY,
    email: data.get('email'),
    first_name: data.get('first_name'),
    fields: {
      score: data.get('score'),
      tier: data.get('tier'),
      goal_tag: data.get('goal_tag'),
      weakest_areas: data.get('weakest')
    },
    tags: [TAG_ID_FOR_TIER]
  })
});
```

**Tag IDs:** After creating tags in ConvertKit, get their numeric IDs from the API or the tag URL. Map them in the code:

```javascript
function getTagIdForTier(tier) {
  const map = {
    'Movement Strong': 'TAG_ID_1',
    'Movement Ready': 'TAG_ID_2',
    'Movement Rebuilder': 'TAG_ID_3',
    'Movement Priority': 'TAG_ID_4'
  };
  return map[tier];
}
```

---

## Email Nurture Sequence

Create a **Visual Automation** in ConvertKit:

**Trigger:** Subscriber added to form "Movement Readiness Quiz"

### Automation Flow:
```
Trigger: Form submitted
  |
  v
Email 1 (immediate) --> Wait 2 days
  |
  v
Email 2 (Day 2) --> Wait 2 days
  |
  v
Email 3 (Day 4) --> Wait 3 days
  |
  v
Email 4 (Day 7) --> Wait 3 days
  |
  v
Email 5 (Day 10) --> END
```

---

## Email 1: Your Movement Readiness Score

**Send:** Immediately after quiz completion
**Subject:** Your Movement Readiness Score: {{ score }}
**Preview text:** Here's what your score means -- and what I'd focus on first.

---

Hi {{ first_name }},

Thanks for taking the Movement Readiness Quiz. Here's your result:

**Your Score: {{ score }} / 100**

{% if tier == "Movement Strong" %}
**Movement Strong** -- Your body is working well. You have strong mobility, good balance, and minimal limitations. You're ahead of most people your age, and that's worth protecting.

The question isn't whether you can move -- it's whether you're moving optimally. Small imbalances compound over time, and what feels fine now can become a limitation in 5 years.
{% endif %}

{% if tier == "Movement Ready" %}
**Movement Ready** -- You have a solid foundation, but there are gaps. Maybe one side is tighter than the other, or your balance isn't quite what it was a few years ago.

The good news: you're in the sweet spot for improvement. Targeted work on your specific weak areas can produce noticeable changes in just a few weeks.
{% endif %}

{% if tier == "Movement Rebuilder" %}
**Movement Rebuilder** -- Your body is asking for attention. Stiffness, instability, or discomfort are starting to limit what you can do -- and that tends to get worse without intervention.

Here's what I want you to know: you're not broken. You're exactly the kind of person who sees dramatic improvements with the right guidance. Small, targeted changes can transform how you feel.
{% endif %}

{% if tier == "Movement Priority" %}
**Movement Priority** -- I'm glad you took this quiz, because your body is telling you something important. Pain, stiffness, and limited confidence aren't things you have to accept.

The people who start where you are often see the biggest changes. You don't need to be fit to begin. You just need to start with the right approach.
{% endif %}

Over the next few days, I'll send you specific tips based on your results. No fluff -- just actionable things you can try today.

Talk soon,
Laura

P.S. If you want to skip ahead and get a complete picture of your movement right now, I do private assessments here in Key West. 60 minutes. Everything mapped. Clear plan. [Book yours here.]

---

## Email 2: The #1 Thing I'd Work On

**Send:** Day 2
**Subject:** The #1 thing I'd work on based on your score
**Preview text:** If I had 5 minutes a day, here's where I'd start.

---

Hi {{ first_name }},

Based on your Movement Readiness Score of {{ score }}, here's the single most impactful thing I'd focus on:

{% if tier == "Movement Strong" %}
**Longevity training.**

You're moving well now. The goal is to make sure you're still moving well at 70, 80, and beyond. That means training the things that decline first: single-leg balance, rotational mobility, and the ability to get up and down from the floor with ease.

Try this: once a day, get down to the floor and back up without using furniture. Time yourself. Track it over a month. You'll learn more about your body from that one drill than most gym routines teach in a year.
{% endif %}

{% if tier == "Movement Ready" %}
**Your weakest link.**

Your score tells me your overall movement is decent, but there's at least one area that's dragging things down. For most people in your range, it's either balance or morning stiffness -- or both.

Try this: every morning this week, spend 2 minutes doing slow hip circles (10 each direction) followed by 30 seconds of single-leg stance on each side. Do it before coffee. Notice what changes by day 5.
{% endif %}

{% if tier == "Movement Rebuilder" %}
**Foundational movement patterns.**

Before worrying about strength or flexibility, we need to make sure your body remembers how to move through basic patterns without compensation. That means: squat, hinge, push, pull, and rotate.

Try this: stand facing a wall, toes 6 inches from the baseboard. Slowly squat as deep as you can without your knees touching the wall. If you can't go past a quarter squat, that's your starting point. Do 5 reps, twice a day, and just explore the range. Don't force it.
{% endif %}

{% if tier == "Movement Priority" %}
**Pain-free range of motion.**

Forget what "exercise" is supposed to look like. Right now, the most valuable thing you can do is find the movements your body CAN do without pain -- and do more of them.

Try this: lie on your back, knees bent. Slowly rock your knees side to side, only going as far as feels comfortable. Do this for 2 minutes. It's not flashy, but it's retraining your nervous system to trust movement again. That's where everything starts.
{% endif %}

This is one drill. In a full assessment, I map dozens of movement patterns and give you a complete plan. But start here -- and notice how your body responds.

Laura

---

## Email 3: How I Got Here

**Send:** Day 4
**Subject:** From performing 1,000 shows to coaching movement
**Preview text:** Why a former professional dancer now helps everyday people move better.

---

Hi {{ first_name }},

Most people don't know this about me, so I wanted to share.

Before I was a movement coach in Key West, I was a founding member of Acosta Danza -- one of Cuba's most renowned contemporary dance companies. I performed over 1,000 shows on stages across the world. I earned an O-1B visa, which is reserved for individuals with extraordinary ability in the arts.

I tell you this not to brag, but to explain something: after 15 years of performing at the highest level, I understand the human body differently than most trainers. I know what a body can do when it's functioning well. And I know exactly what happens when it's not.

When I moved to Key West, I saw something that surprised me. People here are active -- they kayak, paddleboard, fish, dive. But so many of them are limited by stiffness, imbalance, or old injuries they've learned to "work around."

That gap -- between wanting to move and being able to move well -- is what I built my coaching practice around.

My approach isn't about pushing harder. It's about moving smarter. Understanding your body. Finding the patterns that are holding you back and replacing them with ones that serve you.

Whether your Movement Readiness Score was a 92 or a 32, the process is the same: assess, understand, improve. The starting point is different, but the direction is always forward.

Laura

---

## Email 4: What Happens in a Session

**Send:** Day 7
**Subject:** What actually happens in a session with me
**Preview text:** It's not a workout. It's more like a conversation with your body.

---

Hi {{ first_name }},

I get asked this a lot: "What actually happens when I come see you?"

Here's the honest answer: it's not what most people expect.

**It's not a workout.** You won't be dripping sweat or counting reps. I'm not interested in exhausting you. I'm interested in understanding you.

**Here's what a 60-minute assessment looks like:**

First, we talk. I want to know what brings you in, what frustrates you about your body, what you wish you could do that you can't right now. Your Movement Readiness Score gave me clues -- this conversation fills in the picture.

Then, I watch you move. Simple things: walking, squatting, reaching, balancing. I'm looking for compensations -- the workarounds your body has built over years of favoring one side, avoiding certain movements, or pushing through discomfort.

I'll test specific patterns: single-leg stability, hip mobility, shoulder range, spinal rotation. Every finding gets noted.

By the end, you'll understand your body better than you ever have. You'll know exactly what's working, what's compensating, and what needs attention. And you'll have a clear, prioritized plan to start improving.

**Common things I hear after a session:**
- "I had no idea my left hip was that restricted."
- "That explains why my back always hurts after gardening."
- "I've been stretching the wrong thing for years."

**A few things worth knowing:**
- You don't need to be fit to come. I work with every level.
- Wear comfortable clothes you can move in. That's it.
- You'll leave with a written plan, not just verbal advice.

If your quiz score made you curious about what's really going on in your body, an assessment is the fastest way to find out.

[Book Your Assessment -- $125]

Laura

---

## Email 5: A Free Exercise for Your Score

**Send:** Day 10
**Subject:** Your score was {{ score }} -- here's a free exercise to improve it
**Preview text:** One drill targeting your weakest area. Takes 3 minutes.

---

Hi {{ first_name }},

Your Movement Readiness Score was {{ score }}. Here's one specific exercise targeting the area where you scored lowest.

{% if tier == "Movement Strong" %}
**The Turkish Get-Up (Half Version)**

Since your movement foundation is strong, this drill challenges coordination, stability, and strength all at once. Lie on your back with one arm pointing straight up at the ceiling. Now stand up -- keeping that arm vertical the entire time. Use no weight. Focus on control.

Do 3 reps each side, once daily. This single exercise hits nearly every movement pattern your body needs to maintain over the decades ahead.
{% endif %}

{% if tier == "Movement Ready" %}
**The 90/90 Hip Switch**

Sit on the floor with both knees bent at 90 degrees, one in front and one to the side. Slowly rotate your legs to switch sides, keeping your back tall. Go slow. Notice which direction feels tighter.

Do 5 switches, twice daily. This targets the hip mobility and rotational patterns that are often the first to decline -- and the easiest to restore.
{% endif %}

{% if tier == "Movement Rebuilder" %}
**Supported Squat Hold**

Stand facing a doorframe or sturdy post. Hold it with both hands at chest height. Slowly lower into a squat, letting your arms take as much weight as needed. Find a depth where you feel a stretch but no pain. Hold for 30 seconds. Stand up. Repeat 3 times.

Do this daily. Over 2 weeks, you'll notice the depth improving and the support becoming less necessary. That's your body re-learning a pattern it's forgotten.
{% endif %}

{% if tier == "Movement Priority" %}
**Wall-Supported Marching**

Stand with your back against a wall, feet about 12 inches from the baseboard. Slowly lift one knee toward your chest, then lower it. Alternate sides. The wall gives you stability so you can focus on the movement without worrying about balance.

Do 10 lifts per side, twice daily. This is gentle, safe, and it retrains the basic hip flexion and weight-shifting patterns that everything else is built on.
{% endif %}

This is one drill from dozens I use with clients. It's a starting point, not the full picture.

If you want to know exactly what your body needs -- not just one exercise, but a complete map -- that's what the assessment is for.

[Book Your Assessment -- $125]

And hey, if you have questions about your score or this exercise, just reply to this email. I read every one.

Laura

P.S. If you found this quiz helpful, share it with someone who might benefit. Here's the link: [Quiz Link]

---

## Setup Checklist

- [ ] Create ConvertKit account (kit.com, free plan)
- [ ] Create custom fields: score, tier, goal_tag, weakest_areas
- [ ] Create 8 tags (4 tiers + 4 goals)
- [ ] Create 4 segments (one per tier)
- [ ] Create form "Movement Readiness Quiz" (for API endpoint)
- [ ] Get Form ID and API Key
- [ ] Update quiz HTML with Form ID and API Key (uncomment fetch block)
- [ ] Build visual automation with 5 emails
- [ ] Create all 5 emails using templates above
- [ ] Set up conditional content blocks (ConvertKit supports Liquid templating)
- [ ] Test full flow: take quiz > submit email > verify emails arrive
- [ ] Verify tags are applied correctly
- [ ] Verify custom fields are populated

## ConvertKit Liquid Templating Notes

ConvertKit uses Liquid for conditional content. The `{% if %}` blocks in the email templates above use the custom field `tier`. In ConvertKit:

1. Go to the email editor
2. Add a text block
3. Click **Personalize** to insert merge tags
4. For conditional blocks, use ConvertKit's visual conditional content blocks OR switch to HTML mode and use Liquid syntax:
   - `{{ subscriber.first_name }}` for first name
   - `{{ subscriber.fields.score }}` for score
   - `{% if subscriber.fields.tier == "Movement Strong" %}...{% endif %}` for tier-based content

## Booking Link

Replace `[Book Your Assessment -- $125]` with the actual booking URL once Laura's scheduling is set up. Options:
- Calendly link
- Acuity Scheduling link
- Direct link to lauratreto.com/book
