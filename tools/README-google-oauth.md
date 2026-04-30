# Google OAuth refresh token capture

One-shot helper to capture a Google OAuth refresh token authorized as
`laura@lauratreto.com`. The token is used by Netlify functions on
`lauratreto.com` to read/write Laura's Google Calendar and send transactional
emails via Gmail. Run this **once** on Alex's laptop and copy the printed
refresh token into Netlify env. The script never writes the token to disk.

## Prerequisites

A GCP project with:

1. **Google Calendar API** and **Gmail API** enabled.
2. An **OAuth 2.0 Client ID** of type **Web application**.
3. The redirect URI list includes exactly:
   `http://localhost:5173/oauth/callback`
4. The OAuth consent screen is configured. While in Testing mode, add
   `laura@lauratreto.com` (and `alex@alexmene.com` for safety) as test users.

You'll need the **Client ID** and **Client secret** from the OAuth client.

## Install dev deps

The repo has a root `package.json` with `googleapis` as a dev dependency
(separate from `website/package.json`, which is for production code).

```bash
cd "/Users/paymore/Desktop/LAURA TRETO COACHING"
npm install
```

## Run

```bash
cd "/Users/paymore/Desktop/LAURA TRETO COACHING"
GOOGLE_CLIENT_ID=...apps.googleusercontent.com \
GOOGLE_CLIENT_SECRET=GOCSPX-... \
  node tools/google_oauth_capture.mjs
```

Or run with no env vars and answer the prompts.

The script will:

1. Spin up a tiny local HTTP server on `http://localhost:5173`.
2. Print a Google consent URL to the terminal.
3. Open that URL in a browser where you're **signed in as
   `laura@lauratreto.com`** and click **Allow**. Make sure you grant all
   three requested scopes (Calendar, Gmail send, Gmail modify).
4. Google redirects to `localhost:5173/oauth/callback` and the script
   exchanges the code for tokens.
5. The refresh token is printed in a clearly-labeled block. The script also
   lists the next 5 events on the primary calendar as a round-trip sanity
   check.

## Set Netlify env vars

After running, set these in the Netlify project (Site settings -> Env
variables):

| Key | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | the client id from GCP |
| `GOOGLE_CLIENT_SECRET` | the client secret from GCP |
| `GOOGLE_REFRESH_TOKEN` | the refresh token printed by the script |

Redeploy (or trigger a new deploy) so functions pick up the new env.

## Verify the token works

The sanity check is built into the script -- if the upcoming-events list
prints without an error, Calendar access is good. Gmail access is verified
when the first transactional email is sent from a Netlify function.

## If it fails

- **"No refresh_token in response"** -- Laura previously granted consent and
  Google skipped the consent screen. Revoke at
  <https://myaccount.google.com/permissions> and re-run.
- **"Port 5173 in use"** -- `lsof -i :5173`, kill the process, re-run.
- **`access_denied`** -- the consent screen was dismissed; just re-run.
- **redirect_uri_mismatch** -- the OAuth client's redirect URI list does not
  contain `http://localhost:5173/oauth/callback` exactly. Fix in GCP console.
