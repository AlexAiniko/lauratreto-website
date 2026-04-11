// TikTok OAuth Callback Handler
// Netlify Function v2 (ES modules)
//
// Handles the OAuth redirect from TikTok after user authorization.
// Exchanges the authorization code for access + refresh tokens,
// then stores them in Netlify Blobs (store: "tiktok-auth", key: "laura-token").
//
// Deployed at: https://lauratreto.netlify.app/.netlify/functions/tiktok-callback
// Registered redirect URI in TikTok Developer Portal must match exactly.
//
// Required env vars (set in Netlify UI → Site configuration → Environment variables):
//   TIKTOK_CLIENT_KEY    — From TikTok Developer Portal → App details → Client Key
//   TIKTOK_CLIENT_SECRET — From TikTok Developer Portal → App details → Client Secret
//   TIKTOK_OAUTH_STATE   — Random string set ONCE before starting OAuth flow (CSRF protection)
//
// Flow:
//   1. TikTok redirects here with ?code=XXX&state=YYY
//   2. Validate state matches TIKTOK_OAUTH_STATE
//   3. Exchange code for tokens via POST to TikTok token endpoint
//   4. Store token JSON in Netlify Blobs
//   5. Return success HTML page

import { getStore } from "@netlify/blobs";

// ---------------------------------------------------------------------------
// HTML response helpers
// ---------------------------------------------------------------------------

function htmlPage(title, body, status = 200) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
           display: flex; align-items: center; justify-content: center;
           min-height: 100vh; margin: 0; background: #FAF7F2; color: #2B2B2B; }
    .card { background: white; border-radius: 12px; padding: 40px 48px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08); max-width: 480px; text-align: center; }
    h1 { margin: 0 0 16px; font-size: 1.4rem; }
    p  { margin: 0; color: #666; line-height: 1.5; }
    .ok   { color: #1A7A7A; font-size: 2.5rem; margin-bottom: 16px; }
    .err  { color: #C0392B; font-size: 2.5rem; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="card">
    ${body}
  </div>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default async (request) => {
  const CLIENT_KEY    = process.env.TIKTOK_CLIENT_KEY;
  const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
  const OAUTH_STATE   = process.env.TIKTOK_OAUTH_STATE;

  // Env var guard
  if (!CLIENT_KEY || !CLIENT_SECRET || !OAUTH_STATE) {
    console.error("tiktok-callback: missing env vars", {
      hasKey: !!CLIENT_KEY,
      hasSecret: !!CLIENT_SECRET,
      hasState: !!OAUTH_STATE,
    });
    return htmlPage(
      "Configuration Error",
      `<div class="err">⚠</div>
       <h1>Server Misconfigured</h1>
       <p>Required environment variables are not set. Check Netlify dashboard.</p>`,
      500
    );
  }

  const url    = new URL(request.url);
  const code   = url.searchParams.get("code");
  const state  = url.searchParams.get("state");
  const error  = url.searchParams.get("error");
  const errDesc = url.searchParams.get("error_description");

  // TikTok sent back an error (e.g. user denied)
  if (error) {
    console.error("tiktok-callback: TikTok returned error", error, errDesc);
    return htmlPage(
      "Authorization Denied",
      `<div class="err">✗</div>
       <h1>Authorization Failed</h1>
       <p>${errDesc || error}</p>`,
      400
    );
  }

  if (!code || !state) {
    return htmlPage(
      "Bad Request",
      `<div class="err">✗</div>
       <h1>Missing Parameters</h1>
       <p>Expected <code>code</code> and <code>state</code> in the query string.</p>`,
      400
    );
  }

  // CSRF check
  if (state !== OAUTH_STATE) {
    console.error("tiktok-callback: state mismatch", { received: state });
    return htmlPage(
      "Security Error",
      `<div class="err">✗</div>
       <h1>State Mismatch</h1>
       <p>CSRF validation failed. Please re-run the authorization flow.</p>`,
      403
    );
  }

  // Exchange code for tokens
  const tokenParams = new URLSearchParams({
    client_key:    CLIENT_KEY,
    client_secret: CLIENT_SECRET,
    code,
    grant_type:    "authorization_code",
    redirect_uri:  "https://lauratreto.netlify.app/.netlify/functions/tiktok-callback",
  });

  let tokenData;
  try {
    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      const msg = tokenData.error_description || tokenData.error || "Unknown error";
      console.error("tiktok-callback: token exchange failed", tokenRes.status, tokenData);
      return htmlPage(
        "Token Exchange Failed",
        `<div class="err">✗</div>
         <h1>Token Exchange Failed</h1>
         <p>${msg}</p>`,
        502
      );
    }
  } catch (err) {
    console.error("tiktok-callback: fetch error during token exchange", err);
    return htmlPage(
      "Network Error",
      `<div class="err">✗</div>
       <h1>Network Error</h1>
       <p>Could not reach TikTok API. Try again.</p>`,
      502
    );
  }

  // Store tokens in Netlify Blobs
  const tokenRecord = {
    access_token:   tokenData.access_token,
    refresh_token:  tokenData.refresh_token,
    open_id:        tokenData.open_id,
    scope:          tokenData.scope,
    expires_in:     tokenData.expires_in,
    token_type:     tokenData.token_type,
    obtained_at:    new Date().toISOString(),
  };

  try {
    const store = getStore("tiktok-auth");
    await store.setJSON("laura-token", tokenRecord);
    console.log("tiktok-callback: token stored successfully", {
      open_id:     tokenRecord.open_id,
      scope:       tokenRecord.scope,
      expires_in:  tokenRecord.expires_in,
      obtained_at: tokenRecord.obtained_at,
    });
  } catch (err) {
    console.error("tiktok-callback: blob store error", err);
    return htmlPage(
      "Storage Error",
      `<div class="err">✗</div>
       <h1>Token Storage Failed</h1>
       <p>Authorization succeeded but token could not be saved: ${err.message}</p>`,
      500
    );
  }

  return htmlPage(
    "TikTok Connected",
    `<div class="ok">✓</div>
     <h1>TikTok Connected Successfully</h1>
     <p>Authorization complete. You can close this window.</p>`
  );
};

export const config = {
  path: "/.netlify/functions/tiktok-callback",
};
