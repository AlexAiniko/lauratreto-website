#!/usr/bin/env python3
"""
tiktok_authorize.py
-------------------
Run ONCE in terminal to kick off the TikTok OAuth flow for Laura Treto Coaching.

Usage:
    python tools/tiktok_authorize.py

Required env var:
    TIKTOK_CLIENT_KEY — from TikTok Developer Portal → App details → Client Key

What it does:
    1. Reads TIKTOK_CLIENT_KEY from env (prompts if missing).
    2. Generates a random CSRF state string.
    3. Prints the state string → you MUST set this as TIKTOK_OAUTH_STATE in Netlify
       BEFORE opening the auth URL (otherwise the callback will reject the request).
    4. Builds the TikTok authorization URL with required scopes.
    5. Prints the URL and opens it in the default browser.

After authorization:
    TikTok redirects to the Netlify callback function, which exchanges the code
    for tokens and stores them in Netlify Blobs (store: tiktok-auth, key: laura-token).

Scopes requested:
    video.publish  — post videos (as drafts in Sandbox mode)
    video.upload   — upload video files
"""

import os
import sys
import secrets
import webbrowser
from urllib.parse import urlencode

REDIRECT_URI = "https://lauratreto.netlify.app/.netlify/functions/tiktok-callback"
SCOPES       = "video.publish,video.upload"
AUTH_BASE    = "https://www.tiktok.com/v2/auth/authorize/"


def main():
    print("=" * 60)
    print("TikTok OAuth Authorization — Laura Treto Coaching")
    print("=" * 60)
    print()

    # 1. Get client key
    client_key = os.environ.get("TIKTOK_CLIENT_KEY", "").strip()
    if not client_key:
        client_key = input("Enter TIKTOK_CLIENT_KEY (from TikTok Dev Portal): ").strip()
    if not client_key:
        print("ERROR: TIKTOK_CLIENT_KEY is required.", file=sys.stderr)
        sys.exit(1)

    # 2. Generate CSRF state
    state = secrets.token_urlsafe(32)

    # 3. Print state — must be set in Netlify BEFORE opening auth URL
    print("STEP 1 — Set this in Netlify env vars FIRST:")
    print()
    print(f"  Variable name:  TIKTOK_OAUTH_STATE")
    print(f"  Variable value: {state}")
    print()
    print("  Netlify dashboard: Site configuration → Environment variables")
    print("  After saving, redeploy the site (or it won't take effect).")
    print()

    # 4. Build auth URL
    params = {
        "client_key":    client_key,
        "scope":         SCOPES,
        "response_type": "code",
        "redirect_uri":  REDIRECT_URI,
        "state":         state,
    }
    auth_url = AUTH_BASE + "?" + urlencode(params)

    # 5. Print URL and instructions
    print("STEP 2 — After setting the env var and redeploying, open this URL:")
    print()
    print(f"  {auth_url}")
    print()
    print("STEP 3 — Authorize the app in the TikTok popup.")
    print()
    print("STEP 4 — You'll be redirected to lauratreto.netlify.app.")
    print("  If everything is correct you'll see 'TikTok Connected Successfully'.")
    print("  The access_token and refresh_token are now stored in Netlify Blobs.")
    print()
    print("=" * 60)

    open_now = input("Open the auth URL in browser now? [y/N] ").strip().lower()
    if open_now == "y":
        print("Opening browser...")
        webbrowser.open(auth_url)
    else:
        print("URL not opened. Copy it manually from above when ready.")


if __name__ == "__main__":
    main()
