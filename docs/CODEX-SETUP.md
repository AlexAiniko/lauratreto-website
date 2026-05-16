# Codex CLI Setup -- Laura's Mac

Step-by-step setup to take Laura's Mac from zero to first deploy through Codex CLI. Follow top-to-bottom. Each section ends in a verification step. If a step fails, stop and ask Alex.

Throughout this doc, `$PROJECT_ROOT` means the local clone of `AlexAiniko/lauratreto-website`. The recommended path is `~/lauratreto-website`.

---

## 1. Prerequisites

You need these installed and working before starting Codex setup.

### macOS

Sequoia (15) or newer. Check:
```bash
sw_vers
```

### Terminal

Either the built-in Terminal.app or iTerm2. The instructions below assume zsh (macOS default).

### Homebrew

```bash
brew --version
```

If not installed:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Node 22+

```bash
node --version
```

If not installed or older than 22:
```bash
brew install node@22
brew link --overwrite node@22
```

### Git

Comes with Xcode Command Line Tools. Check:
```bash
git --version
```

If missing:
```bash
xcode-select --install
```

### 1Password

Install the desktop app from <https://1password.com/downloads/mac/>. Sign in. Confirm you can see the **"Laura Treto Coaching"** shared vault. If not, ask Alex to share it.

---

## 2. Install Codex CLI

The canonical project brief file Codex reads is `AGENTS.md` at the repo root (already in this repo).

Codex CLI's install command has shifted over time. Check the current method at <https://github.com/openai/codex> before running. As of early 2026 the two common paths are:

```bash
# Option A: Homebrew (if available on your platform)
brew install codex

# Option B: npm global install
npm install -g @openai/codex-cli
```

Verify:
```bash
codex --version
```

Sign in to OpenAI / ChatGPT through the Codex CLI auth flow (it opens a browser):
```bash
codex login
```

---

## 3. Install Netlify CLI + Playwright

```bash
brew install netlify-cli
netlify --version

npx playwright install chromium
```

---

## 4. Clone the repo

Pick a path. Recommended: `~/lauratreto-website`. Anywhere your home directory is fine.

```bash
cd ~
git clone https://github.com/AlexAiniko/lauratreto-website.git lauratreto-website
cd lauratreto-website
```

From here on, `$PROJECT_ROOT = ~/lauratreto-website` (or wherever you cloned).

---

## 5. Configure git author

Even though you authenticate to GitHub via Alex's PAT (next step), your commits should show as Laura's authorship. Set this **once per clone**:

```bash
cd $PROJECT_ROOT
git config user.name "Laura Treto"
git config user.email "laura@lauratreto.com"
```

Verify:
```bash
git config user.name    # should print: Laura Treto
git config user.email   # should print: laura@lauratreto.com
```

---

## 6. Set up secrets

Open 1Password and find the **"Laura Treto Coaching"** vault. Create `~/.codex/secrets.env` from the values there:

```bash
mkdir -p ~/.codex
touch ~/.codex/secrets.env
chmod 600 ~/.codex/secrets.env
```

Then open `~/.codex/secrets.env` in your editor and populate the subset Codex needs for website + email work:

```bash
# Google OAuth (booking + email)
GOOGLE_CLIENT_ID=<paste from 1Password>
GOOGLE_CLIENT_SECRET=<paste from 1Password>
GOOGLE_REFRESH_TOKEN=<paste from 1Password>
BOOKING_CALENDAR_ID=primary
BOOKING_TIMEZONE=America/New_York
BOOKING_HOURS=9-19
BOOKING_SKIP_DAYS=0,6

# MailerLite
MAILERLITE_API_KEY=<paste from 1Password>

# Stripe (restricted read-only key only)
STRIPE_RESTRICTED_KEY=<paste from 1Password>
```

**Important:** for production pushes you do NOT need to mirror these locally. They already live on Netlify. The local copy is only needed if you run `netlify dev` for local function testing (step 9).

Keep `~/.codex/secrets.env` out of git -- it's outside `$PROJECT_ROOT` so it's automatically untracked.

---

## 7. Auth Netlify

```bash
netlify login
```

A browser opens. Sign in. The CLI captures a token.

Link the local clone to the `lauratreto` Netlify site:
```bash
cd $PROJECT_ROOT/website
netlify link
```

When prompted, choose **"Use current git remote origin"** or select `lauratreto` from the list.

Verify:
```bash
netlify status
```

Should print site name `lauratreto`, account, and admin URL.

---

## 8. Auth GitHub

Open 1Password -> "Laura Treto Coaching" -> "GitHub PAT - lauratreto-website". Copy the token.

Option A (recommended) -- store as a file and use `gh`:
```bash
brew install gh
echo "<paste PAT>" > ~/.gh-pat
chmod 600 ~/.gh-pat
gh auth login --with-token < ~/.gh-pat
```

Option B -- use git credential helper. Configure `git` to use macOS Keychain:
```bash
git config --global credential.helper osxkeychain
# Then on next `git push`, paste the PAT when prompted for password. Keychain remembers it.
```

Either works. Verify:
```bash
gh auth status                  # if you used Option A
# or just try a push (Option B)
```

---

## 9. First smoke test (no code change)

Hit the production booking-availability endpoint:
```bash
curl -s "https://lauratreto.com/.netlify/functions/calendar-availability?days=2" | head -200
```

You should see JSON with a `slots` array. If yes, Google OAuth + Netlify functions are healthy and your auth setup is good.

If you get an error or empty response, check:
```bash
netlify functions:log --stream &  # leave running in another tab
# Then hit the endpoint again. The logs will show the failure reason.
```

---

## 10. First real change (verify push works)

Edit a tiny copy line in `website/index.html` -- pick something obvious you can revert later (a comment, a non-visible test marker, or revert the change after verifying):

```bash
cd $PROJECT_ROOT
# Edit website/index.html with your editor of choice
git add website/index.html
git commit -m "test: verify Codex push works"
git push origin main
```

Watch the deploy:
```bash
netlify watch
```

Or check status repeatedly:
```bash
netlify status
```

Within ~90 seconds the deploy should go live. Hit `https://lauratreto.com` and confirm the change is there. Then revert if it was a test marker.

---

## 11. Configure project MCP (optional but recommended)

Copy the example MCP config to a real one (the real one is gitignored):

```bash
cd $PROJECT_ROOT
cp .mcp.json.example .mcp.json
```

Open `.mcp.json` and paste API keys from 1Password for any MCP you want. Playwright works without a key (it spawns a local browser). Firecrawl needs a key but is optional.

Restart Codex so it picks up the new MCP config.

---

## 12. Verification suite (must all pass before declaring setup done)

Run each step. If any fails, stop and ask Alex.

### 12.1 Auth check
```bash
gh auth status                                                   # GitHub OK
netlify status                                                   # Netlify linked to lauratreto
git config user.name && git config user.email                    # Laura Treto, laura@lauratreto.com
```

### 12.2 Code change round-trip
Edit a single line of copy (e.g., a hero subhead). Commit. Push. Within 90 seconds the live site reflects the change.

### 12.3 Email automation check
1. Change one word in a welcome-email line in `website/netlify/lib/email.js`.
2. Push. Wait for deploy.
3. Submit a fresh test booking on `https://lauratreto.com/client` using `laura+codextest@lauratreto.com`.
4. Open Laura's inbox. The welcome email should contain the new word.
5. Cleanup: delete the test event from Laura's Google Calendar (use the Calendar UI in her browser).

### 12.4 Playwright E2E
Run a Playwright booking-flow check via Codex MCP -- ask Codex to "use the playwright MCP to load /client, walk through the booking flow, and confirm the calendar slot picker renders." Codex spawns a local browser and reports back.

### 12.5 Scope boundary check
Ask Codex to "update the Trainerize onboarding pipeline." Codex should respond with the boundary statement from `AGENTS.md` ("That's Alpha's surface...") and stop. If it tries to do the work anyway, re-read `AGENTS.md` together.

### 12.6 OAuth rotation drill
Follow `docs/GOOGLE-OAUTH-ROTATION.md` end-to-end on a non-urgent day. Mint a fresh refresh token, push to Netlify env, redeploy, then re-run the smoke test in 12.1. This proves the rotation workflow works before you need it under pressure.

---

## When something breaks

- **Push rejected (auth):** PAT expired or revoked. Get a fresh one from Alex via 1Password.
- **Push rejected (non-fast-forward):** Alpha pushed since your last pull. `git pull --rebase origin main`, resolve conflicts if any, push again.
- **Netlify deploy fails:** check the deploy log in Netlify dashboard. Most common cause: missing env var. Run `netlify env:list` to confirm what's set in production.
- **Function returns 500:** `netlify functions:log --stream`, hit the endpoint again, read the stack trace.
- **OAuth `invalid_grant` error:** the refresh token is dead. Follow `docs/GOOGLE-OAUTH-ROTATION.md`.
- **Anything else:** drop a note in `Input/` for Alex with the error and what you tried.

---

## Daily workflow once setup is done

```bash
cd $PROJECT_ROOT
git pull origin main          # always pull first
# edit files
git add <files>
git commit -m "concise message"
git push origin main
# verify on https://lauratreto.com within 90s
```

That's it. No PRs, no review gates. Codex commits directly to `main`. Netlify auto-deploys. Verify the live result, every time.
