// TEMPORARY one-shot cleanup endpoint for the merge-emails test artifacts.
// Deletes a calendar event by ID and removes a MailerLite subscriber by email.
// Guarded by a token query param. Deployed once, runs cleanup, then removed.
//
// GET /.netlify/functions/_cleanup-merge?token=XXX&event=EID&email=ADDR
// Multiple cleanups: pass repeated &event=&email= or call multiple times.

import { getGoogleClient } from '../lib/google.js';

const CLEANUP_TOKEN = 'lux-merge-cleanup-2026-05-01';

export default async (request) => {
  const url = new URL(request.url);
  if (url.searchParams.get('token') !== CLEANUP_TOKEN) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  const events = url.searchParams.getAll('event');
  const emails = url.searchParams.getAll('email');
  const out = { events: [], subscribers: [] };

  if (events.length) {
    const { calendar } = getGoogleClient();
    for (const eventId of events) {
      try {
        await calendar.events.delete({ calendarId: 'primary', eventId, sendUpdates: 'none' });
        out.events.push({ id: eventId, ok: true });
      } catch (err) {
        out.events.push({ id: eventId, ok: false, error: err?.message || String(err) });
      }
    }
  }

  if (emails.length) {
    const API_KEY = process.env.MAILERLITE_API_KEY;
    for (const email of emails) {
      try {
        const lookup = await fetch(`https://connect.mailerlite.com/api/subscribers/${encodeURIComponent(email)}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' },
        });
        if (!lookup.ok) {
          out.subscribers.push({ email, ok: false, status: lookup.status, error: 'lookup failed' });
          continue;
        }
        const j = await lookup.json();
        const id = j?.data?.id;
        if (!id) {
          out.subscribers.push({ email, ok: false, error: 'no id in lookup body' });
          continue;
        }
        const del = await fetch(`https://connect.mailerlite.com/api/subscribers/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' },
        });
        out.subscribers.push({ email, id, ok: del.ok, status: del.status });
      } catch (err) {
        out.subscribers.push({ email, ok: false, error: err?.message || String(err) });
      }
    }
  }

  return new Response(JSON.stringify(out, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
