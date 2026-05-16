# Google OAuth refresh-token rotation procedure

How to rotate the refresh token that powers booking v2 (Google Calendar event create + Gmail transactional sends). When and why.

`$PROJECT_ROOT` below = wherever you cloned this repo locally (e.g., `~/lauratreto-website`).

## When to rotate

- **Scheduled (every 6-12 months):** routine hygiene
- **Immediate (within 24 hours):** any time the token has been pasted to chat, screenshotted, leaked, or you suspect it
- **On revocation:** if Laura revokes app access at <https://myaccount.google.com/permissions>, the token is dead and a fresh one must be captured
- **On secret rotation:** if the OAuth client secret is rotated in GCP, the refresh token survives but Netlify env's `GOOGLE_CLIENT_SECRET` must be updated to the new value
- **On password change for `laura@lauratreto.com`:** Google invalidates ALL refresh tokens issued to that account. Confirmed via incident 2026-05-16 -- Laura changed her password, every booking + email since failed with `invalid_grant` for 9 days until rotation.

## Rotation history

- 2026-04-30: initial capture
- 2026-05-16: rotated after Laura's password change. Caught by user report ("I booked but got no notification"). Production app was already in Production mode (not Testing), so the 7-day Testing expiry was NOT the cause.

## Procedure

1. **Optional: revoke the old token** at <https://myaccount.google.com/permissions> while signed in as `laura@lauratreto.com`. Find "Laura Treto Booking" -> Remove access. (Skipping this means both old and new tokens work briefly, fine for hot-swap.)

2. **Re-run the capture script:**
   ```bash
   cd $PROJECT_ROOT
   export GOOGLE_CLIENT_ID="<paste from 1Password>"
   node tools/google_oauth_capture.mjs
   ```
   It prompts for the secret (paste from password manager -- never put in chat).

3. **Open the consent URL in incognito as `laura@lauratreto.com`**, click Allow. Browser redirects to localhost which the script captures.

4. **Copy the new refresh token** from terminal output. Don't screenshot.

5. **Update Netlify env (CLI v24.9.0 gotcha):**
   Netlify CLI v24.9.0+ refuses to set `--context` AND `--scope` on an existing variable in one call ("Setting the context and scope at the same time on an existing env var is not allowed"). Workaround: unset first, then set fresh.
   ```bash
   netlify env:unset GOOGLE_REFRESH_TOKEN --force
   netlify env:set GOOGLE_REFRESH_TOKEN "<new token>" --context production --scope functions --force
   ```
   The `--secret` flag may silently no-op on this CLI version. The `--force` flag is reliable for overwrite. Also confirmed: zsh's `read -s -p "prompt"` does NOT work (errors `read: -p: no coprocess`) -- use `echo -n "Paste: " && read -s VAR && echo` instead.

6. **Update your local `~/.codex/secrets.env`** so `netlify dev` keeps working locally:
   ```bash
   # Open ~/.codex/secrets.env in your editor and replace the old GOOGLE_REFRESH_TOKEN line.
   ```
   (Alex's Alpha also keeps a copy in `alpha.db` -- that's Alpha's concern, not yours.)

7. **Test:** hit `https://lauratreto.com/.netlify/functions/calendar-availability?days=2` and confirm slots return. If 200 with slots, rotation worked. If empty/error, check Netlify function logs via `netlify functions:log --stream`.

## Why publishing matters

OAuth apps in **Testing** mode in GCP issue refresh tokens that **expire after 7 days**. Apps in **Production** mode issue tokens that don't expire (until manually revoked or the user's password changes severely).

The Laura Treto Booking app should be in Production. Status check: <https://console.cloud.google.com> -> Google Auth Platform -> Audience. If "Publishing status" says "Testing," click "Publish app" -- it's a one-way move and doesn't require Google verification for our scope set.

## Refresh token format reminder

- Starts with `1//` (Google's convention for OAuth refresh tokens)
- ~100-200 chars long
- Treat as a password: never log, never commit, never paste in chat unprompted

## Related credentials

Stored in 1Password "Laura Treto Coaching" vault and mirrored as Netlify env vars:

- `GOOGLE_CLIENT_ID` (public-ish)
- `GOOGLE_CLIENT_SECRET` (secret)
- `GOOGLE_REFRESH_TOKEN` (most-secret, rotate periodically)
- `BOOKING_CALENDAR_ID` (`primary`)
- `BOOKING_TIMEZONE` (`America/New_York`)
