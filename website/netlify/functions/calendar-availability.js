// GET /.netlify/functions/calendar-availability?days=14[&weekends=1]
//
// Returns: { slots: [{ startISO, endISO, displayDate, displayTime, time24, weekday }, ...] }
// `time24` is the wall-clock time in `H:MM` 24-hour format (no leading zero on
// the hour), in the configured BOOKING_TIMEZONE — submit it back to
// /client-funnel as `body.time` without conversion.
//
// Query flags:
//   days=14       window length (max 30)
//   weekends=1    override BOOKING_SKIP_DAYS for this request — include Sat+Sun.
//                 Used by /book-dance-lesson (tourists are weekend-heavy).
//
// Errors return 200 with { slots: [], error: '...' } so the client can fall
// back gracefully (e.g. show a static time list).
//
// Rate limit: 60 GETs / minute / IP.
// Cache: private, max-age=60 (slots refresh frequently).

import { rateLimit, jsonResponse } from '../lib/sanitize.js';
import { getAvailableSlots } from '../lib/calendar.js';

const CACHE_HEADERS = { 'Cache-Control': 'private, max-age=60' };

export default async (request) => {
  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }
  if (request.method !== 'GET') {
    return jsonResponse({ slots: [], error: 'Method Not Allowed' }, 405);
  }

  const ip =
    request.headers.get('x-nf-client-connection-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  if (!rateLimit(ip, 60, 60000)) {
    return jsonResponse({ slots: [], error: 'Too many requests' }, 429);
  }

  const url = new URL(request.url);
  let days = Number(url.searchParams.get('days')) || 14;
  if (!Number.isFinite(days) || days < 1) days = 14;
  if (days > 30) days = 30; // hard cap

  // weekends=1 → empty skipDays set, every weekday shows up. Anything else
  // falls through to BOOKING_SKIP_DAYS (default Sun + Sat).
  const includeWeekends = url.searchParams.get('weekends') === '1';
  const slotOpts = { days };
  if (includeWeekends) slotOpts.skipDays = new Set();

  try {
    const slots = await getAvailableSlots(slotOpts);
    return jsonResponse({ slots }, 200, CACHE_HEADERS);
  } catch (err) {
    console.error('[calendar-availability] failed:', err?.message || err);
    return jsonResponse({ slots: [], error: 'availability lookup failed' }, 200);
  }
};
