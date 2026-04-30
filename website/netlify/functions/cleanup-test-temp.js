// TEMPORARY one-shot cleanup endpoint. Deletes a calendar event by ID and
// removes a MailerLite subscriber by ID. Guarded by a token query param to
// avoid abuse. Intended to be deployed once and then removed.
//
// GET /.netlify/functions/_cleanup-test?token=XXX&event=EID&subscriber=SID

import { getGoogleClient } from '../lib/google.js';

const CLEANUP_TOKEN = 'lux-cleanup-2026-04-30';

export default async (request) => {
  const url = new URL(request.url);
  if (url.searchParams.get('token') !== CLEANUP_TOKEN) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  const eventId = url.searchParams.get('event');
  const subscriberId = url.searchParams.get('subscriber');
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

  if (subscriberId) {
    const API_KEY = process.env.MAILERLITE_API_KEY;
    try {
      const res = await fetch(`https://connect.mailerlite.com/api/subscribers/${encodeURIComponent(subscriberId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' },
      });
      out.subscriber_deleted = { id: subscriberId, ok: res.ok, status: res.status };
    } catch (err) {
      out.subscriber_deleted = { id: subscriberId, ok: false, error: err?.message || String(err) };
    }
  }

  return new Response(JSON.stringify(out, null, 2), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
