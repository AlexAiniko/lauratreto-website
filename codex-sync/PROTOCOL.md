# Cross-Model Bridge Protocol -- Codex (Laura) <-> Alpha (Alex)

**Purpose:** Define how files flow between Laura's Codex CLI and Alex's Claude Code (Alpha) now that Laura's Codex commits directly to the repo.

## What changed (May 2026)

Before May 2026, Alex was the single bridge: Laura emailed files, Alex dropped them in `Input/`, Alpha processed and deposited deliverables in `Output/`, Alex carried them back to Laura's separate workspace.

After May 2026, Laura's Codex CLI runs on her own Mac with full access to this repo. She commits website + email work directly to `main`. The `Input/` and `Output/` folders are now a **cross-domain deliverable bridge**, not a primary work channel.

## Ownership (the short version)

- **Codex (Laura) owns:** the website, the booking + email automation, the quiz, the MailerLite drip copy, the Google OAuth rotation. She edits files in this repo and pushes to `main`. Netlify auto-deploys.
- **Alpha (Alex) owns:** Trainerize, the Instagram bot, ManyChat, TikTok, Meta API posting, `alpha.db` operational state, GA4 reporting, social-content tooling (Higgsfield, Fal, Firecrawl), `.credentials/`.

See `HANDOFF.md` at the repo root for the full table.

## When to use the cross-model bridge

Only when work crosses ownership boundaries. Examples:

### Alpha -> Codex
- Alpha drafts a research memo on a competitor in Key West and wants Laura's Codex to fold the findings into website copy. Alpha writes `Output/LAURA-competitor-research-<date>.md`. Laura tells Codex: "Alpha left me a research memo, take a look and update the differentiator section on the homepage."
- Alpha generates Instagram caption drafts for week N. Alpha writes `Output/LAURA-instagram-week-N-captions.md`. Laura reviews, schedules the posts in her own tooling. (If Laura wants the captions to also appear as testimonials or social proof on the site, Codex pulls from this file.)
- Alpha produces a Romy research memo (e.g., barefoot-shoe ambassador opportunities). Alpha writes `Output/LAURA-<topic>-Research-<date>.md`.

### Codex -> Alpha
- Codex pulls a MailerLite performance summary while writing email copy variants. Drops the numbers in `Input/mailerlite-week-N-summary.md` so Alpha can fold it into `alpha.db` KPI tracking.
- Codex updates a customer-facing booking-flow copy line that should also be mirrored in Trainerize email templates. Drops a note in `Input/booking-copy-changed-<date>.md` so Alpha syncs Trainerize.
- Codex notices a content opportunity from a website analytics signal (e.g., the quiz dropoff page has a spike). Drops a brief in `Input/content-signal-<date>.md`.

## Folder structure

```
codex-sync/
├── PROTOCOL.md           <- This file
├── codex-database/       <- (Optional) Exports from Laura's Codex KB if she ever wants Alpha to review them
└── inbox/                <- (Legacy) Pre-handoff Codex outputs. Kept for historical reference.

Input/                    <- Codex -> Alpha. Gitignored. Manual file drop.
Output/                   <- Alpha -> Codex. Gitignored. Manual file drop.
```

## Rules

1. **No cross-contamination.** Codex never loads Alpha's CLAUDE.md or memory. Alpha never loads AGENTS.md as its primary brief. Each side has its own canonical project brief.
2. **Manual bridge only.** No automated sync between `Input/` and `Output/` and any other system. Laura tells Codex what arrived; Alex tells Alpha what arrived. (If we ever want to automate, that's a separate decision.)
3. **Naming convention:**
   - `Output/LAURA-<topic>.md` -- from Alpha to Codex
   - `Input/<topic>.md` -- from Codex to Alpha (no special prefix needed; Alex's Input is unambiguous)
4. **Format for the other side's consumption.** Plain markdown with clear headers. No model-specific references (don't reference Alpha's `alpha.db` schema in `Output/`; don't reference Codex's local MCP setup in `Input/`).
5. **Date-stamp memos.** Include the date in the filename (e.g., `Output/LAURA-competitor-research-2026-05-16.md`) so older deliverables don't get re-applied by accident.
6. **Both sides commit to `main` directly.** Pull before pushing. No PR workflow.
7. **Announce cross-side changes that affect both surfaces.** If Codex changes a function signature in `website/netlify/lib/email.js` that Alpha was importing into a script, drop a note in `Input/` so Alpha updates its caller.

## What this protocol does NOT cover

- Direct customer-facing decisions (those go through Laura and Alex talking to each other, not through the file bridge)
- Time-sensitive incidents (use Slack/text, not file drops)
- Sensitive credentials (use 1Password, never the file bridge)
