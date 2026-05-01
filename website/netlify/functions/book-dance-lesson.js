// Tourist dance-lesson booking → Calendar + Gmail + MailerLite
// Netlify Function v2 (ES modules)
//
// Receives /book-dance-lesson submissions, upserts the prospect into the
// kw-dance-events MailerLite group with the dance-lesson-booked tag, creates
// a Google Calendar event, and sends 2 transactional emails (confirmation to
// prospect, notification to laura@). All post-MailerLite work runs through
// Promise.allSettled so any single failure never blocks the response.
//
// Deployed at: https://lauratreto.netlify.app/.netlify/functions/book-dance-lesson
//
// Required env vars (already set for client-funnel + event-signup):
//   MAILERLITE_API_KEY
//   MAILERLITE_GROUP_KW_DANCE  (defaults to 186207950945126028)
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
//   BOOKING_CALENDAR_ID  (default: primary)
//   BOOKING_TIMEZONE     (default: America/New_York)

import { sanitize, isValidEmail, jsonResponse, rateLimit } from '../lib/sanitize.js';
import { createBookingEvent } from '../lib/calendar.js';
import { sendDanceLessonConfirmation, sendDanceLessonNotification } from '../lib/email.js';

const BOOKING_TIMEZONE = process.env.BOOKING_TIMEZONE || 'America/New_York';
const KW_DANCE_GROUP = process.env.MAILERLITE_GROUP_KW_DANCE || '186207950945126028';
// MailerLite uses Groups (not Tags) for segmentation in the Connect API.
// `dance-lesson-booked` is a group, not a tag — same intent (segment all
// bookers regardless of tier so an automation can fire), surfaced via the
// MailerLite API contract that actually exists.
const DANCE_BOOKED_GROUP = process.env.MAILERLITE_GROUP_DANCE_BOOKED || '186211048518321222';
const VALID_TYPES = new Set(['solo', 'couple', 'group']);

const TIER_META = {
  solo:   { label: 'Solo Lesson',   price: '$150', durationMin: 60 },
  couple: { label: 'Couple Lesson', price: '$200', durationMin: 60 },
  group:  { label: 'Small Group',   price: '$300', durationMin: 75 },
};

export default async (request, context) => {
  if (request.method === 'OPTIONS') return jsonResponse({ ok: true });
  if (request.method !== 'POST') return jsonResponse({ error: 'Method Not Allowed' }, 405);

  const ip =
    request.headers.get('x-nf-client-connection-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  if (!rateLimit(ip, 20, 60000)) {
    return jsonResponse({ error: 'Too many requests. Try again in a minute.' }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const honeypot = sanitize(body.website || body.bot_field || '', 50);
  if (honeypot) {
    console.log('[book-dance-lesson] honeypot tripped from', ip);
    return jsonResponse({ success: true, message: 'Thanks' });
  }

  const email = sanitize(body.email, 120).toLowerCase();
  const firstName = sanitize(body.first_name, 60);
  const lessonType = sanitize(body.lesson_type, 10).toLowerCase();
  const notes = sanitize(body.notes, 280);
  const language = sanitize(body.language, 10) || 'en';
  const date = sanitize(body.date, 80);
  const time = sanitize(body.time, 20);

  if (!isValidEmail(email)) return jsonResponse({ error: 'Invalid email' }, 400);
  if (!firstName) return jsonResponse({ error: 'First name required' }, 400);
  if (!VALID_TYPES.has(lessonType)) return jsonResponse({ error: 'Invalid lesson type' }, 400);
  if (!date || !time) return jsonResponse({ error: 'Pick a date and time' }, 400);

  const tier = TIER_META[lessonType];
  const url = new URL(request.url);
  const testMode = url.searchParams.get('t') === '1';
  if (testMode) {
    console.log('[book-dance-lesson] TEST mode skip', { email, lessonType, date, time });
    return jsonResponse({ success: true, lesson_type: lessonType, test: true });
  }

  const API_KEY = process.env.MAILERLITE_API_KEY;
  if (!API_KEY) {
    console.error('[book-dance-lesson] MAILERLITE_API_KEY missing');
    return jsonResponse({ error: 'Server misconfigured' }, 500);
  }

  // 1) MailerLite upsert (must succeed — this is the lead-of-record).
  const subscriberPayload = {
    email,
    fields: {
      name: firstName || undefined,
      lesson_type: lessonType,
      booking_date: date || undefined,
      booking_time: time || undefined,
      lesson_notes: notes || undefined,
      language,
      source: 'book-dance-lesson',
      last_lesson_booking_at: new Date().toISOString(),
    },
    groups: [KW_DANCE_GROUP, DANCE_BOOKED_GROUP],
    status: 'active',
  };

  let subscriberId = null;
  try {
    const res = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(subscriberPayload),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('[book-dance-lesson] MailerLite error:', res.status, JSON.stringify(data));
      return jsonResponse({ error: 'Booking service is temporarily unavailable. Please try again.', details: data }, 502);
    }
    subscriberId = data?.data?.id || null;
    console.log('[book-dance-lesson] subscribed', { email, lessonType, subscriberId });
  } catch (err) {
    console.error('[book-dance-lesson] mailerlite fetch error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }

  // 1b) The dance-lesson-booked GROUP assignment happens above as part of
  // the subscribers POST (groups: [KW_DANCE_GROUP, DANCE_BOOKED_GROUP]).
  // MailerLite Connect API doesn't have separate "tags" — groups are the
  // segmentation primitive — so the bucket-based group is the correct
  // equivalent of the briefed `dance-lesson-booked` tag.

  // 2) Calendar + emails — Promise.allSettled so failures never break response.
  const postProcess = runDanceLessonPostProcess({
    subscriberId,
    firstName,
    email,
    lessonType,
    tier,
    date,
    time,
    notes,
    language,
  });

  if (typeof context?.waitUntil === 'function') {
    context.waitUntil(postProcess);
  } else {
    await postProcess;
  }

  return jsonResponse({
    success: true,
    lesson_type: lessonType,
    subscriber_id: subscriberId,
  });
};

async function runDanceLessonPostProcess({
  subscriberId, firstName, email, lessonType, tier,
  date, time, notes, language,
}) {
  // Compute event window using the slot's submitted ISO + H:MM in BOOKING_TIMEZONE.
  let startISO = null;
  let endISO = null;
  try {
    if (date && time) {
      const parsed = parseBookingDateTime(date, time, BOOKING_TIMEZONE, tier.durationMin);
      if (parsed) {
        startISO = parsed.startISO;
        endISO = parsed.endISO;
      }
    }
  } catch (err) {
    console.error('[book-dance-lesson] parse date/time failed:', err?.message || err);
  }

  const displayDate = formatBookingDate(date, BOOKING_TIMEZONE);
  const displayTime = time || '';

  let calendarEventLink = null;
  let calendarEventId = null;

  // 2a) Google Calendar event
  const calendarTask = (async () => {
    if (!startISO || !endISO) return null;
    const summary = `Dance Lesson: ${tier.label} — ${firstName || email}`;
    const descriptionLines = [
      `New dance lesson booking from /book-dance-lesson.`,
      ``,
      `Tier: ${tier.label} (${tier.price}, ${tier.durationMin} min)`,
      `Name: ${firstName || '(not provided)'}`,
      `Email: ${email}`,
      `Notes: ${notes || '(none)'}`,
      `Language: ${language}`,
    ];
    const event = await createBookingEvent({
      summary,
      description: descriptionLines.join('\n'),
      startISO,
      endISO,
      attendeeEmail: email,
      attendeeName: firstName || email,
    });
    calendarEventId = event?.id || null;
    calendarEventLink = event?.htmlLink || null;
    console.log(`[book-dance-lesson] calendar event created: ${calendarEventId}`);
    return event;
  })();

  // Wait for the calendar to land BEFORE firing the emails so we can include
  // the event link. If it fails, emails still go out without the link.
  try {
    await calendarTask;
  } catch (err) {
    console.error(`[book-dance-lesson] calendar create failed: ${err?.message || err}`);
  }

  const tasks = [
    sendDanceLessonNotification({
      prospectName: firstName,
      prospectEmail: email,
      lessonType,
      date: displayDate || date,
      time: displayTime,
      language,
      notes,
      calendarEventLink,
    }),
    sendDanceLessonConfirmation({
      prospectName: firstName,
      prospectEmail: email,
      lessonType,
      date: displayDate || date,
      time: displayTime,
      language,
      notes,
      calendarEventLink,
    }),
  ];

  const results = await Promise.allSettled(tasks);
  const [notifyResult, confirmResult] = results;
  if (notifyResult.status === 'fulfilled') {
    console.log('[book-dance-lesson] email to laura: ok');
  } else {
    console.error(`[book-dance-lesson] email-laura failed: ${notifyResult.reason?.message || notifyResult.reason}`);
  }
  if (confirmResult.status === 'fulfilled') {
    console.log('[book-dance-lesson] email to prospect: ok');
  } else {
    console.error(`[book-dance-lesson] email-prospect failed: ${confirmResult.reason?.message || confirmResult.reason}`);
  }
}

// ---------- helpers ----------

function parseBookingDateTime(dateISO, timeStr, tz, durationMinutes) {
  const d = new Date(dateISO);
  if (isNaN(d.getTime())) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(timeStr.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
  const [y, mo, dy] = ymd.split('-').map(Number);

  const fakeUtc = Date.UTC(y, mo - 1, dy, hour, minute, 0);
  const offsetMin = tzOffsetMinutes(new Date(fakeUtc), tz);
  const realUtc = fakeUtc - offsetMin * 60 * 1000;
  const start = new Date(realUtc);
  const end = new Date(realUtc + durationMinutes * 60 * 1000);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

function tzOffsetMinutes(date, tz) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour), Number(parts.minute), Number(parts.second)
  );
  return Math.round((asUtc - date.getTime()) / 60000);
}

function formatBookingDate(dateISO, tz) {
  if (!dateISO) return '';
  const d = new Date(dateISO);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'long', month: 'long', day: 'numeric',
  }).format(d);
}

export const config = {
  path: '/.netlify/functions/book-dance-lesson',
};
