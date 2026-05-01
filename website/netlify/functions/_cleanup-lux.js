// TEMPORARY one-shot cleanup endpoint for Lux's welcome-email test artifacts.
// Deletes a calendar event by ID and removes a MailerLite subscriber by email.
// Guarded by a token query param. Deployed once, runs cleanup, then removed.
//
// Filename underscore prefix excludes from auto-routing in some configs;
// keeping a token guard regardless.
//
// GET /.netlify/functions/_cleanup-lux?token=XXX&event=EID&email=ADDR

import { getGoogleClient } from '../lib/google.js';

const CLEANUP_TOKEN = 'lux-welcome-cleanup-2026-04-30';

export default async (request) => {
  const url = new URL(request.url);
  if (url.searchParams.get('token') !== CLEANUP_TOKEN) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  const eventId = url.searchParams.get('event');
  const email = url.searchParams.get('email');
  const out = { event_deleted: null, subscriber_deleted: null };

  if (eventId) {
    try {
      const { calendar } = getGoogleClient();
      await calendar.events.delete({ calendarId: 'primary', eventId, sendUpdates: 'none' });
      out.event_deleted = { id: eventId, ok: true };
    } catch (err) {
      out.event_deleted = { id: eventId, ok: false, error: err?.message || String(err) };
    }
  }

  if (email) {
    const API_KEY = process.env.MAILERLITE_API_KEY;
    try {
      // Look up subscriber by email to get the numeric id.
      const lookup = await fetch(`https://connect.mailerlite.com/api/subscribers/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' },
      });
      if (!lookup.ok) {
        out.subscriber_deleted = { email, ok: false, status: lookup.status, error: 'lookup failed' };
      } else {
        const j = await lookup.json();
        const id = j?.data?.id;
        if (!id) {
          out.subscriber_deleted = { email, ok: false, error: 'no id in lookup body' };
        } else {
          const del = await fetch(`https://connect.mailerlite.com/api/subscribers/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' },
          });
          out.subscriber_deleted = { email, id, ok: del.ok, status: del.status };
        }
      }
    } catch (err) {
      out.subscriber_deleted = { email, ok: false, error: err?.message || String(err) };
    }
  }

  return new Response(JSON.stringify(out, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
