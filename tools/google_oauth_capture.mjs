#!/usr/bin/env node
// google_oauth_capture.mjs
// One-shot OAuth consent helper. Run on Alex's laptop ONCE, signed in as
// laura@lauratreto.com, to capture a Google refresh token authorized for
// Calendar + Gmail. The refresh token is printed to the terminal only --
// nothing is written to disk.
//
// Usage:
//   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
//     node tools/google_oauth_capture.mjs
//   (Or run with no env vars and answer the prompts.)
//
// Prereqs: a GCP OAuth Web client whose redirect URI list includes
//   http://localhost:5173/oauth/callback

import http from 'node:http';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { URL } from 'node:url';
import { google } from 'googleapis';

const REDIRECT_URI = 'http://localhost:5173/oauth/callback';
const PORT = 5173;

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
];

// ---------- helpers ----------

async function promptIfMissing(envValue, label, { mask = false } = {}) {
  if (envValue && envValue.trim()) return envValue.trim();
  const rl = readline.createInterface({ input, output });
  // Note: readline does not natively mask input. We document this in the README;
  // the value also lives in the GCP console, so this is acceptable for a
  // one-shot dev helper.
  const answer = await rl.question(`${label}${mask ? ' (will be visible)' : ''}: `);
  rl.close();
  if (!answer || !answer.trim()) {
    console.error(`\nMissing ${label}. Aborting.`);
    process.exit(2);
  }
  return answer.trim();
}

function htmlPage({ title, body, color = '#1A7A7A' }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif;
           background: #FAF7F2; color: #2B2B2B;
           display: grid; place-items: center; min-height: 100vh; margin: 0; }
    .card { max-width: 480px; padding: 32px 36px; border-radius: 12px;
            background: white; box-shadow: 0 6px 24px rgba(0,0,0,0.06);
            text-align: center; }
    h1 { color: ${color}; margin: 0 0 12px; font-size: 22px; }
    p { margin: 0; line-height: 1.5; color: #555; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${body}</p>
  </div>
</body>
</html>`;
}

// Wait for a single OAuth callback and return the parsed query params.
function waitForCallback(server) {
  return new Promise((resolve, reject) => {
    server.on('request', (req, res) => {
      // Only the callback path matters; ignore favicon etc.
      const url = new URL(req.url, `http://localhost:${PORT}`);
      if (url.pathname !== '/oauth/callback') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }

      const params = Object.fromEntries(url.searchParams.entries());

      if (params.error) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(htmlPage({
          title: 'Authorization failed',
          body: `Google returned error: <strong>${params.error}</strong>. You can close this window and re-run the script.`,
          color: '#E8654A',
        }));
        reject(new Error(`OAuth error: ${params.error}`));
        return;
      }

      if (!params.code) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(htmlPage({
          title: 'No authorization code',
          body: 'The callback did not include a code parameter. You can close this window and re-run the script.',
          color: '#E8654A',
        }));
        reject(new Error('OAuth callback did not include a code parameter.'));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(htmlPage({
        title: 'Done. You can close this window.',
        body: 'The refresh token is now printed in the terminal where you ran the script.',
      }));
      resolve(params);
    });

    server.on('error', reject);
  });
}

// ---------- main ----------

async function main() {
  const clientId = await promptIfMissing(process.env.GOOGLE_CLIENT_ID, 'GOOGLE_CLIENT_ID');
  const clientSecret = await promptIfMissing(process.env.GOOGLE_CLIENT_SECRET, 'GOOGLE_CLIENT_SECRET', { mask: true });

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    include_granted_scopes: true,
  });

  // Start local server BEFORE printing the URL so we don't miss the callback.
  const server = http.createServer();
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\nPort ${PORT} is already in use. Stop whatever is using it (lsof -i :${PORT}) and re-run.`);
      process.exit(3);
    }
    console.error('\nLocal server error:', err.message);
    process.exit(4);
  });

  await new Promise((resolve, reject) => {
    server.listen(PORT, '127.0.0.1', resolve);
    server.once('error', reject);
  });

  console.log('\n----------------------------------------------------------------');
  console.log('Open this URL in a browser where you are signed in as');
  console.log('laura@lauratreto.com. Click Allow. The browser will redirect to');
  console.log(`localhost:${PORT}, which this script is listening on.`);
  console.log('----------------------------------------------------------------\n');
  console.log(authUrl);
  console.log('\n(waiting for the redirect ...)\n');

  let params;
  try {
    params = await waitForCallback(server);
  } catch (err) {
    server.close();
    console.error(`\nAuth failed: ${err.message}`);
    process.exit(5);
  }

  // Trade the code for tokens.
  let tokens;
  try {
    const res = await oauth2Client.getToken(params.code);
    tokens = res.tokens;
  } catch (err) {
    server.close();
    console.error('\nFailed to exchange code for tokens:', err.message);
    process.exit(6);
  } finally {
    server.close();
  }

  if (!tokens.refresh_token) {
    console.error('\nGoogle did not return a refresh_token. This usually means');
    console.error('Laura had previously consented and prompt=consent was ignored.');
    console.error('Revoke prior consent at https://myaccount.google.com/permissions');
    console.error('and re-run this script.');
    process.exit(7);
  }

  oauth2Client.setCredentials(tokens);

  console.log('\n================ REFRESH TOKEN ================');
  console.log(tokens.refresh_token);
  console.log('===============================================');
  console.log('COPY THIS into Netlify env as GOOGLE_REFRESH_TOKEN');
  console.log('Also set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
  if (tokens.scope) {
    console.log(`\nGranted scopes: ${tokens.scope}`);
  }
  if (tokens.expiry_date) {
    console.log(`Access token expires: ${new Date(tokens.expiry_date).toISOString()}`);
  }

  // Sanity check: list 5 upcoming events on the primary calendar.
  console.log('\n----------------------------------------------------------------');
  console.log('Sanity check: listing the next 5 events on your primary calendar');
  console.log('----------------------------------------------------------------');
  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: 'startTime',
    });
    const items = res.data.items || [];
    if (items.length === 0) {
      console.log('(no upcoming events found, but the API call succeeded -- token is valid)');
    } else {
      for (const ev of items) {
        const when = ev.start?.dateTime || ev.start?.date || 'unknown';
        console.log(`- ${when}  ${ev.summary || '(no title)'}`);
      }
    }
  } catch (err) {
    console.error('\nCalendar list call FAILED:', err.message);
    console.error('The token may still be valid for Gmail; verify Calendar scope was granted.');
    process.exit(8);
  }

  console.log('\nAll done. You can close the browser tab.');
  process.exit(0);
}

main().catch((err) => {
  console.error('\nUnexpected error:', err);
  process.exit(1);
});
