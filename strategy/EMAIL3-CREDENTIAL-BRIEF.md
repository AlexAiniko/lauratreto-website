# Email 3 — "Laura's Story" — Credential Brief
**Source:** graphify knowledge graph analysis, 2026-04-11
**For:** Whoever writes Email 3 copy (Laura, Alex, or content agent)
**Status:** Brief only — copy not yet written

---

## The Graph Finding

The current spec (LEAD-MAGNET-SPEC.md, line 242-250) routes Email 3 through a single credential: **Acosta Danza**. Every other credential in Laura's background has to travel through `Laura → Acosta Danza` to reach the email — they are not independently wired in.

The graph mapped these 5 unused direct paths:

| Credential | Distance to Email 3 | Current status |
|-----------|---------------------|----------------|
| O-1B visa (extraordinary ability) | 3 hops | Not in email copy |
| Psychology degree, Univ. of Havana | 3 hops | Mentioned in passing ("psychology angle") |
| The Mavericks / lead singer client | 3 hops | Not in email copy |
| ~1,000 career performances | 3 hops | Mentioned in spec subject line only |

**What this means:** The email subject line says "1,000 shows" but the body only tells the Acosta Danza story. The reader gets the number without the weight behind it.

---

## Revised Email 3 Structure

The graph suggests a **5-beat story arc** — one beat per unused credential — rather than a single linear narrative:

### Beat 1 — The stage (opens the credibility loop)
> "I spent 15 years performing on stages across 5 continents. Not as a hobby. With Acosta Danza — Carlos Acosta's company. The kind of dancing where your body is your entire career."

Nodes activated: `Acosta Danza`, `Carlos Acosta` (world-class choreographer, sets the caliber immediately)

### Beat 2 — The break (the turn)
> "At 1,000 shows, you learn something most personal trainers never encounter: what happens when the body starts failing a professional. Not soreness. Real breakdown."

Nodes activated: `~1,000 career shows`, `Concept: Bulletproofing Joints`, `Concept: PT-to-Weight-Room Gap`

### Beat 3 — The pivot (the unexpected credential)
> "What saved me wasn't more training. It was psychology. I studied clinical psychology at the University of Havana specifically because I needed to understand the mental side of physical decline — fear of re-injury, identity loss, the moment an athlete stops believing in their body."

Nodes activated: `Psychology degree (Havana)`, `wellness_skill_wellness_coaching`, `O-1B visa` (frame it as: "The U.S. government classifies me as an artist of extraordinary ability — but what that actually means is...")

### Beat 4 — The proof (high-stakes application)
> "I took that combination — elite movement training plus clinical psychology — to The Mavericks. The band. I traveled as their wellness coach and tour manager for 3 years. My job was keeping Raul Malo's body functional through 100-show years."

Nodes activated: `The Mavericks`, `High-Profile Client: Lead Singer`, `tm_skill_wellness_support`

### Beat 5 — The close (why this matters to the reader)
> "I moved to Key West to stop doing that at scale and start doing it personally. The quiz you took? It's a clinical movement screen based on what I developed over 15 years for professional performers. Except it's designed for people who aren't performers — people who just want to move without pain, feel strong at 40, 50, 60."

Nodes activated: `Movement Readiness Score Quiz`, `Target Demographic: Adults 40+`, `Primary CTA: Book Movement Assessment ($125)`

---

## What Changes in the CTA

Current spec: generic "book an assessment" button.

Graph-informed CTA: tie it back to the credential stack specifically:

> "The same assessment framework I used with world-class performers — adapted for real life. 60 minutes, $125. If you're serious about understanding your body, this is where to start."

This closes the credential loop: you opened with "I worked with extraordinary bodies" and you close with "now I use that same framework for you."

---

## Notes for Copy Writer

- Laura's voice is warm, direct, never braggy. The credentials are stated as context, not as flex.
- The psychology degree is the most surprising credential — lean into it. Most fitness coaches don't have it.
- The Mavericks story is the proof-of-concept for everyday clients: if her methods worked for a touring musician's 60-year-old body under extreme stress, they work for anyone.
- Keep the O-1B visa brief — one sentence framing, not a paragraph. The point is: extraordinary ability is legally certified, not self-proclaimed.
- Do NOT reference the Yuli film — not part of the story we're telling here.
- The graph confirms Acosta Danza is the gateway for all these credentials. Start there, then fan out.

---

## Graph Queries for Reference

To re-trace these paths at any time:
```
/graphify path "Acosta Danza" "Email 3: Laura's Story"
/graphify path "Psychology Degree" "Movement Readiness Score Quiz"
/graphify explain "Movement Readiness Score Quiz"
/graphify query "Email 3 credentials story funnel"
```
