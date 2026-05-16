# Handoff -- Codex (Laura) <-> Alpha (Alex)

One-page contract for who owns what across the Laura Treto Coaching project.

## Setup pointers

- **Codex setup (Laura's Mac):** `docs/CODEX-SETUP.md`
- **Codex project brief:** `AGENTS.md` (root of this repo)
- **Alpha project brief:** `CLAUDE.md` (root of this repo, untouched)
- **OAuth rotation procedure:** `docs/GOOGLE-OAUTH-ROTATION.md`
- **Cross-model bridge protocol:** `codex-sync/PROTOCOL.md`

## Ownership

| Surface | Codex (Laura) | Alpha (Alex) |
|---|---|---|
| `website/` (HTML/CSS/JS, copy, brand visuals) | OWNS | -- |
| `website/netlify/functions/*` + `website/netlify/lib/*` | OWNS | -- |
| MailerLite drip series (dashboard + API) | OWNS | -- |
| Google Calendar booking flow + OAuth rotation | OWNS | -- |
| Quiz funnel (`quiz/`) | OWNS | -- |
| Email copy drafts (`email/`) | OWNS | -- |
| `strategy/`, `calendar/`, `docs/` (reference) | reads | edits when needed |
| Trainerize integration + client onboarding pipeline | -- | OWNS |
| Instagram bot, ManyChat webhook | -- | OWNS |
| TikTok integration + sandbox/production app | -- | OWNS |
| Meta / IG / FB Graph API posting | -- | OWNS |
| `alpha.db` (operational state, KPIs, tasks, revenue) | -- | OWNS |
| GA4 reporting | -- | OWNS |
| Higgsfield / Fal / Firecrawl MCP (content tooling) | -- | OWNS |
| `.credentials/` (Meta tokens) | -- | OWNS |
| Higher-level strategy + product decisions | inputs | OWNS |

## How to escalate

- **Codex hits an Alpha-owned surface:** stop. Tell Laura: "That's Alpha's surface. Ask Alex." Optionally drop a brief in `Input/` for Alex to pick up.
- **Alpha hits a Codex-owned surface:** Alpha can still read website source for context, but for code changes Alpha drops a brief or copy in `Output/LAURA-<topic>.md`. Codex picks it up and ships the change.
- **Either side blocked on a credential:** check 1Password "Laura Treto Coaching" vault first. If missing, Alex provisions it.

## Cross-model bridge

For work that crosses ownership boundaries:

- **Alpha -> Codex deliverables:** `Output/LAURA-<topic>.md` (e.g., research memos, competitor briefs, draft social copy for the site's social proof section).
- **Codex -> Alpha deliverables:** `Input/<topic>.md` (e.g., performance data from MailerLite, draft email variants for A/B testing, copy changes Alpha should know about for cross-channel consistency).

Both directories are gitignored. The bridge is a manual file drop on Laura's Mac. No automated sync.

See `codex-sync/PROTOCOL.md` for the detailed protocol.

## Shared infra

Neither side moves these without coordinating:

- **GitHub repo:** `AlexAiniko/lauratreto-website` (this repo). Both push to `main`. Pull before pushing.
- **Netlify project:** `lauratreto` (auto-deploys on push to `main`). Laura is a team member; Alex owns billing.
- **MailerLite account:** Laura's login. Both sides can use the API.
- **Google OAuth refresh token:** stored as Netlify env var `GOOGLE_REFRESH_TOKEN`. Rotation procedure in `docs/GOOGLE-OAUTH-ROTATION.md`. Either side can rotate; both should announce it before doing so to avoid stomping.
- **Stripe live keys:** Alex-owned. Restricted read-only keys can go in 1Password for either side to use.

## Branch policy

Both sides commit directly to `main`. No PR workflow. Netlify auto-deploys.

If you need a feature branch (rare), name it `<owner>/<topic>` (e.g., `codex/quiz-redesign`, `alpha/trainerize-webhook`) so attribution is clear.

## Reverting

If a push breaks production:

1. `git revert <bad-sha> && git push origin main` -- this is the safest path. Netlify redeploys.
2. Or roll back via Netlify dashboard -> Deploys -> previous deploy -> Publish.

Don't `git reset --hard` on `main`. Use revert.
