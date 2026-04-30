// Shared Google OAuth2 client factory.
// Reads GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN from env.
// Returns an authorized calendar + gmail client pair sharing one OAuth2 client.
//
// Refresh token was authorized as laura@lauratreto.com with scopes:
//   - https://www.googleapis.com/auth/calendar
//   - https://www.googleapis.com/auth/gmail.send
//   - https://www.googleapis.com/auth/gmail.modify

import { google } from 'googleapis';

let cachedClient = null;

export function getGoogleClient() {
  if (cachedClient) return cachedClient;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  const missing = [];
  if (!clientId) missing.push('GOOGLE_CLIENT_ID');
  if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET');
  if (!refreshToken) missing.push('GOOGLE_REFRESH_TOKEN');
  if (missing.length) {
    throw new Error(
      `[lib/google] missing required env vars: ${missing.join(', ')}`
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  cachedClient = { calendar, gmail, oauth2Client };
  return cachedClient;
}
