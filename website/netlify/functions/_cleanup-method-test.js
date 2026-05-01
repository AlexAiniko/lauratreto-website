// TEMP: cleanup endpoint for method-test fixtures (4 calendar events + 4 MailerLite subs).
// Remove in a follow-up commit once the tests are verified clean.
//
// GET /.netlify/functions/_cleanup-method-test
// Returns JSON with per-target status. Idempotent.

import { getGoogleClient } from '../lib/google.js';

const TEST_EMAILS = [
  'alex+method-test-a@alexmene.com',
  'alex+method-test-b@alexmene.com',
  'alex+method-test-c@alexmene.com',
  'alex+method-test-d@alexmene.com',
];

export default async () => {
  const results = { calendar: [], mailerlite: [] };

  // 1) Find + delete calendar events created during the test run.
  try {
    const { calendar } = getGoogleClient();
    const calendarId = process.env.BOOKING_CALENDAR_ID || 'primary';
    // Look for AlexTest discovery-call events on May 1, 2026.
    const list = await calendar.events.list({
      calendarId,
      timeMin: '2026-05-01T00:00:00Z',
      timeMax: '2026-05-02T00:00:00Z',
      q: 'AlexTest',
      maxResults: 50,
      singleEvents: true,
    });
    const events = list.data.items || [];
    for (const ev of events) {
      const desc = (ev.description || '').toLowerCase();
      const matchesTest = TEST_EMAILS.some((e) => desc.includes(e));
      if (!matchesTest) {
        results.calendar.push({ id: ev.id, summary: ev.summary, status: 'skipped (no test email match)' });
        continue;
      }
      try {
        await calendar.events.delete({ calendarId, eventId: ev.id, sendUpdates: 'none' });
        results.calendar.push({ id: ev.id, summary: ev.summary, status: 'deleted' });
      } catch (err) {
        results.calendar.push({ id: ev.id, summary: ev.summary, status: 'error', error: err?.message });
      }
    }
  } catch (err) {
    results.calendar.push({ status: 'list-error', error: err?.message || String(err) });
  }

  // 2) Delete MailerLite subscribers.
  const API_KEY = process.env.MAILERLITE_API_KEY;
  if (!API_KEY) {
    results.mailerlite.push({ status: 'skipped (no MAILERLITE_API_KEY)' });
  } else {
    for (const email of TEST_EMAILS) {
      try {
        const lookup = await fetch(
          `https://connect.mailerlite.com/api/subscribers/${encodeURIComponent(email)}`,
          { headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' } }
        );
        if (!lookup.ok) {
          results.mailerlite.push({ email, status: `lookup ${lookup.status}` });
          continue;
        }
        const data = await lookup.json();
        const id = data?.data?.id;
        if (!id) {
          results.mailerlite.push({ email, status: 'no id in lookup response' });
          continue;
        }
        const del = await fetch(`https://connect.mailerlite.com/api/subscribers/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' },
        });
        results.mailerlite.push({ email, id, status: del.ok ? 'deleted' : `delete ${del.status}` });
      } catch (err) {
        results.mailerlite.push({ email, status: 'error', error: err?.message || String(err) });
      }
    }
  }

  return new Response(JSON.stringify(results, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
