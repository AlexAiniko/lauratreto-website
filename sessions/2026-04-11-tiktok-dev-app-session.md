# Session: 2026-04-11

**Started:** ~12:00 AM
**Last Updated:** 1:40 AM
**Project:** Laura Treto Coaching
**Topic:** TikTok for Developers app setup — sandbox configured up to Login Kit + Content Posting API

---

## What We Are Building

A TikTok integration for Laura Treto Coaching so we can (a) auto-publish scheduled videos to @coachlauratreto from our internal tooling and (b) pull post performance/analytics into alpha.db. This sits alongside the existing Meta/IG integration and is intended as an internal tool only — Laura is the sole TikTok account being managed. We do NOT plan to ship a public consumer app, so the working assumption is "sandbox forever, never submit for production review" unless circumstances change.

The TikTok app is `Laura Treto Coaching` (App type: Other), with a sandbox named `Alpha Dev` underneath it. Long term this becomes the credentials substrate for Alpha to schedule, post, and report on TikTok content as part of the broader content engine.

---

## What WORKED (with evidence)

- **TikTok app creation** — confirmed by: app visible in developer portal, app detail page renders with Production + Sandbox tabs
- **terms.html shipped** — confirmed by: `curl -sI https://lauratreto.com/terms.html` returned HTTP 200, content-length 10869, served from Netlify Edge. Commit `6ac8ef8` on AlexAiniko/lauratreto-website main
- **Footer link to /terms.html** — confirmed by: Max reported edits to website/index.html (EN + ES spans), part of commit 6ac8ef8
- **Domain verification file deployed** — confirmed by: `curl -s https://lauratreto.com/tiktokwlBobcPKYEwggTmo6qhD0xNT7pigii8Q.txt` returned `tiktok-developers-site-verification=wlBobcPKYEwggTmo6qhD0xNT7pigii8Q` (68 bytes, content-type text/plain), byte-for-byte match with Downloads original. Commit `e2a767b`
- **TikTok URL prefix verification** — confirmed by: TikTok portal screenshot showed `https://lauratreto.com/` listed under "Verified properties" with type "URL prefix" for Production
- **Kettlebell app icon generated** — confirmed by: `Output/LAURA-tiktok-app-icon-1024.png` exists, 1024x1024 PNG, visually verified by reading the image. Coral background, round body + open grip handle. Source script: `tools/make_app_icon.py`
- **Sandbox `Alpha Dev` created** — confirmed by: TikTok portal screenshot showed "You are editing Alpha Dev, a Sandbox version of Laura Treto Coaching" with Client key + Client secret fields populated (still hidden behind dots)
- **Login Kit + Content Posting API added to sandbox** — confirmed by: user reported "I already added then those two that you told me"

---

## What Did NOT Work (and why)

- **First Production Basic info save attempt** — failed because: I incorrectly told Alex to leave the Terms of Service URL blank. TikTok marks Terms as required (red asterisk) and rejected the save, dropping the entire draft. Took us into a re-fill loop after a page refresh. Lesson: Terms is mandatory for any TikTok app submission, period
- **Higgsfield image generation for the app icon** — failed because: API returned `403 Not enough credits`. Pivoted to local PIL drawing
- **First three icon attempts** — failed because: I kept trying to compose a kettlebell from a circle body + trapezoid neck. The trapezoid bottom was always wider than the circle's slice width near the body top, producing visible triangular "flaps" sticking out at the junction. Tried smaller trapezoid, taller body, wider body — math fights itself unless the body is huge or the neck is so narrow it looks like a person icon (which the rounded-rect attempt produced)
- **Rounded-rectangle body version** — failed because: Alex correctly said "a kettlebell is round, not square — looks like a hammer." Pivoted to a polygon-based silhouette with bezier shoulders for the final working version
- **Webhooks product** — not added (decision, not failure) because: TikTok webhook events are limited to video lifecycle (`video.upload`, `video.publish.complete`, `video.publish.failed`, `authorization.removed`). No comment or DM events. Doesn't unlock monetization for us. Skipped

---

## What Has NOT Been Tried Yet

- Reveal Client key + Client secret in sandbox UI (eye icons next to the dotted fields)
- Store TikTok sandbox client_key + client_secret in `alpha.db` `credentials` table
- Select scopes in sandbox: `user.info.basic`, `user.info.profile`, `user.info.stats`, `video.list`, `video.publish`, `video.upload`
- Configure sandbox Redirect URI — will be a Netlify function endpoint, e.g. `https://lauratreto.com/.netlify/functions/tiktok-oauth-callback`
- Click "Apply changes" to save the sandbox config
- Add Laura's TikTok account (@coachlauratreto) as a sandbox tester
- Build the OAuth callback Netlify function
- Build a first test post via Content Posting API (probably a draft post first, then a real publish)
- Decide whether we want to wire TikTok analytics into alpha.db on a poll (e.g. nightly cron) or only on-demand

---

## Current State of Files

| File | Status | Notes |
| --- | --- | --- |
| `tools/make_app_icon.py` | Complete | Polygon + bezier kettlebell silhouette generator. Outputs `Output/LAURA-tiktok-app-icon-1024.png` |
| `Output/LAURA-tiktok-app-icon-1024.png` | Complete | Final 1024x1024 kettlebell icon, uploaded to TikTok app |
| `website/terms.html` | Complete (deployed) | Bilingual EN/ES Terms of Service. Shipped via commit 6ac8ef8 on AlexAiniko/lauratreto-website main |
| `website/index.html` | Complete (deployed) | Footer now includes Terms of Service / Términos del Servicio link next to Privacy. Same commit |
| `website/tiktokwlBobcPKYEwggTmo6qhD0xNT7pigii8Q.txt` | Complete (deployed) | TikTok URL-prefix verification signature file. MUST stay live forever or domain verification breaks. Commit e2a767b |
| `alpha.db` (tasks table) | Updated | Inserted task: "TikTok developer app: finish Sandbox config + build integration", status `in_progress`, priority `high`, owner `alpha`. Description holds the next-step checklist |
| `sessions/2026-04-11-tiktok-dev-app-session.md` | This file | Session log for resume |
| `~/.claude/projects/-Users-paymore-Desktop-LAURA-TRETO-COACHING/memory/project_updates_apr11.md` | Complete | Auto-memory note covering this session |
| `~/.claude/projects/-Users-paymore-Desktop-LAURA-TRETO-COACHING/memory/MEMORY.md` | Updated | Index appended with apr 11 session entry |

---

## Decisions Made

- **Individual developer, not Organization** — reason: Laura has no LLC of her own; the partnership-level LLC is unrelated. Solo path is faster, no business verification overhead
- **Sandbox-only operation, defer Production review indefinitely** — reason: This is an internal tool for one account. Production review requires a demo video showing every product/scope end-to-end (~2h production job), explanation copy, and TikTok approval cycles. Sandbox gives us full API access for our use case with zero of that overhead
- **Login Kit + Content Posting API only** — reason: Login Kit is required as a dependency for Content Posting and also covers user.info.* scopes (TikTok folded what used to be "Display API" reads into Login Kit scopes). Content Posting handles publish. Together they cover both our publish and analytics-read needs
- **Skip Webhooks** — reason: Limited event surface (video lifecycle only), no comments/DMs, no monetization unlock, and adding products inflates production review scrutiny. Can add later if TikTok expands
- **Skip Share Kit, Data Portability** — reason: Share Kit is UI-only sharing widgets (not our use case). Data Portability is for user data export (not our use case)
- **URL prefix verification over DNS verification** — reason: Faster, fully automatable through the website repo, no DNS propagation wait, doesn't touch our existing DNS setup
- **Kettlebell icon built with polygon + bezier rather than primitive shapes** — reason: Earlier attempts using circle + trapezoid + ellipse compositions all produced flap artifacts or non-kettlebell silhouettes. Polygon outline with quadratic bezier shoulders gave a clean unified silhouette in one shot

---

## Blockers & Open Questions

- Does TikTok sandbox require us to *also* fill Terms / Privacy / Platforms in sandbox Basic info, or did Alex's last fill cover that? (User said "done" — assume yes, but verify on resume)
- What exact path do we want for the OAuth callback? Suggest `/.netlify/functions/tiktok-oauth-callback`. Confirm with Alex on resume
- Production draft still has the "2 errors" warning (App review section blank). Leave as-is unless we change strategy and decide to submit for production
- Should we set up a nightly cron to pull TikTok video stats into `alpha.db`? Decide once integration is functional

---

## Exact Next Step

In the TikTok developer portal, on the `Alpha Dev` sandbox page:
1. Click the eye icon next to **Client key** and copy the value
2. Click the eye icon next to **Client secret** and copy the value
3. Paste both into chat. Alpha will immediately store them in `alpha.db` `credentials` table (service: `tiktok_sandbox`) and confirm
4. Then scroll to **Scopes** in the left sidebar and add: `user.info.basic`, `user.info.profile`, `user.info.stats`, `video.list`, `video.publish`, `video.upload`
5. Then to **Sandbox settings** → set Redirect URI to `https://lauratreto.com/.netlify/functions/tiktok-oauth-callback`
6. Click **Apply changes** at the top right

After that, Alpha builds the Netlify function and we test the OAuth flow.

---

## Environment & Setup Notes

- TikTok verification file at `https://lauratreto.com/tiktokwlBobcPKYEwggTmo6qhD0xNT7pigii8Q.txt` MUST stay live. Do not delete `website/tiktokwlBobcPKYEwggTmo6qhD0xNT7pigii8Q.txt` or TikTok will un-verify the domain
- `website/_redirects` has a SPA catch-all `/* /index.html 200`. Netlify serves existing static files before applying rewrites, so the verification file works regardless. If we ever add new static `.txt` files at the website root, no special handling needed
- Two git repos in play: project root (private) and `website/` subdirectory (public, AlexAiniko/lauratreto-website). Always commit website edits from inside `website/` so the push hits the right remote
- TikTok meta long-lived user token still expires 2026-06-03 (unrelated to TikTok work but flagged as a renewal item)
