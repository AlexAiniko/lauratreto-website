// Scan-to-lead funnel → MailerLite subscribe webhook
// Netlify Function v2 (ES modules)
//
// Receives /client funnel submissions, segments into one of 4 buckets
// (dance-online, dance-local, train-online, train-local), upserts the
// subscriber in MailerLite, and respects first-bucket on re-scan.
//
// Deployed at: https://lauratreto.netlify.app/.netlify/functions/client-funnel
//
// Required env vars (set in Netlify UI):
//   MAILERLITE_API_KEY                       — MailerLite JWT Bearer token
//   MAILERLITE_GROUP_DANCE_ONLINE            — group id (TODO from Alex)
//   MAILERLITE_GROUP_DANCE_LOCAL             — group id (TODO from Alex)
//   MAILERLITE_GROUP_TRAIN_ONLINE            — group id (TODO from Alex)
//   MAILERLITE_GROUP_TRAIN_LOCAL             — group id (TODO from Alex)
//   SCAN_FUNNEL_LIVE                         — 'false' to short-circuit (test mode)
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
//   GOOGLE_REFRESH_TOKEN                     — Laura's Google OAuth (calendar + gmail)
//   BOOKING_CALENDAR_ID                      — calendar to write events to (default: primary)
//   BOOKING_TIMEZONE                         — IANA tz for events (default: America/New_York)

import { getStore } from '@netlify/blobs';
import { createBookingEvent } from '../lib/calendar.js';
import { sendBookingNotification, sendBookingConfirmation, sendWelcomeEmail } from '../lib/email.js';

const BOOKING_TIMEZONE = process.env.BOOKING_TIMEZONE || 'America/New_York';

const BUCKET_GROUPS = {
  'dance-online': process.env.MAILERLITE_GROUP_DANCE_ONLINE || 'TODO_DANCE_ONLINE_GROUP_ID',
  'dance-local':  process.env.MAILERLITE_GROUP_DANCE_LOCAL  || 'TODO_DANCE_LOCAL_GROUP_ID',
  'train-online': process.env.MAILERLITE_GROUP_TRAIN_ONLINE || 'TODO_TRAIN_ONLINE_GROUP_ID',
  'train-local':  process.env.MAILERLITE_GROUP_TRAIN_LOCAL  || 'TODO_TRAIN_LOCAL_GROUP_ID',
};

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60000;
const rateState = new Map();

function rateLimit(ip) {
  const now = Date.now();
  const entry = rateState.get(ip) || { count: 0, reset: now + RATE_LIMIT_WINDOW_MS };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + RATE_LIMIT_WINDOW_MS;
  }
  entry.count += 1;
  rateState.set(ip, entry);
  return entry.count <= RATE_LIMIT_MAX;
}

function sanitize(text, maxLen = 200) {
  if (typeof text !== 'string') return '';
  return text.replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

function warnPlaceholders() {
  const placeholders = Object.entries(BUCKET_GROUPS)
    .filter(([, v]) => typeof v === 'string' && v.startsWith('TODO_'))
    .map(([k]) => k);
  if (placeholders.length) {
    console.warn('[client-funnel] placeholder group ids still active for buckets:', placeholders.join(', '));
  }
}
warnPlaceholders();

export default async (request, context) => {
  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  const ip =
    request.headers.get('x-nf-client-connection-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  if (!rateLimit(ip)) {
    return jsonResponse({ error: 'Too many requests. Try again in a minute.' }, 429);
  }

  const url = new URL(request.url);
  const queryTest = url.searchParams.get('t') === '1';
  const envTest = process.env.SCAN_FUNNEL_LIVE === 'false';
  const testMode = queryTest || envTest;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const honeypot = sanitize(body.website || body.bot_field || '', 50);
  if (honeypot) {
    console.log('[client-funnel] honeypot tripped from', ip);
    return jsonResponse({ success: true, message: 'Thanks' });
  }

  const email = sanitize(body.email, 120).toLowerCase();
  const firstName = sanitize(body.first_name, 60);
  const phoneRaw = sanitize(body.phone, 40);
  const phone = phoneRaw.replace(/\D+/g, '').slice(0, 20);
  const language = sanitize(body.language, 10) || 'en';
  const intent = sanitize(body.intent, 10);
  const mode = sanitize(body.mode, 10);
  const eventId = sanitize(body.event_id, 80) || 'unknown';
  const source = sanitize(body.source, 40) || 'client-scan';
  const date = sanitize(body.date, 80);
  const time = sanitize(body.time, 20);
  const meetingMethod = sanitize(body.meeting_method, 20);

  if (!isValidEmail(email)) {
    return jsonResponse({ error: 'Invalid email' }, 400);
  }
  if (!['dance', 'train'].includes(intent) || !['online', 'local'].includes(mode)) {
    return jsonResponse({ error: 'Invalid intent or mode' }, 400);
  }

  const newBucket = `${intent}-${mode}`;
  const groupId = BUCKET_GROUPS[newBucket];

  if (testMode) {
    console.log('[client-funnel] TEST mode skip', { email, newBucket, eventId });
    return jsonResponse({ success: true, bucket: newBucket, dedup: false, test: true });
  }

  const API_KEY = process.env.MAILERLITE_API_KEY;
  if (!API_KEY) {
    console.error('[client-funnel] MAILERLITE_API_KEY missing');
    return jsonResponse({ error: 'Server misconfigured' }, 500);
  }

  // Internal notification for in-person leads — write a Blob entry so Laura/Alpha
  // can poll the inbox until SMTP wiring lands in v2.
  if (mode === 'local') {
    try {
      const inbox = getStore({ name: 'client-funnel-inbox', consistency: 'eventual' });
      const key = `inbox/${Date.now()}-${email}`;
      await inbox.set(key, JSON.stringify({
        ts: new Date().toISOString(),
        email, firstName, phone, intent, mode, eventId, language, ip, date, time,
        meeting_method: meetingMethod,
      }));
    } catch (err) {
      console.error('[client-funnel] inbox blob write failed:', err);
    }
  }

  // Dedupe: if subscriber already exists with a scan_funnel_bucket, keep that
  // bucket and only refresh last_scan_at. Prevents two automations firing.
  let dedupBucket = null;
  try {
    const lookup = await fetch(`https://connect.mailerlite.com/api/subscribers/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
      },
    });
    if (lookup.ok) {
      const existing = await lookup.json();
      const priorBucket = existing?.data?.fields?.scan_funnel_bucket;
      if (priorBucket && BUCKET_GROUPS[priorBucket]) {
        dedupBucket = priorBucket;
      }
    }
  } catch (err) {
    console.error('[client-funnel] subscriber lookup failed:', err);
  }

  const finalBucket = dedupBucket || newBucket;
  const finalGroupId = BUCKET_GROUPS[finalBucket] || groupId;
  const nowIso = new Date().toISOString();

  const subscriberPayload = {
    email,
    fields: {
      name: firstName || undefined,
      phone: phone || undefined,
      intent,
      mode,
      scan_event: eventId,
      scan_funnel_bucket: finalBucket,
      last_scan_at: nowIso,
      language,
      source,
      booking_date: date || undefined,
      booking_time: time || undefined,
      meeting_method: meetingMethod || undefined,
    },
    groups: [finalGroupId],
    status: 'active',
  };

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
      console.error('[client-funnel] MailerLite error:', res.status, JSON.stringify(data));
      return jsonResponse({ error: 'Signup service is temporarily unavailable. Please try again.', details: data }, 502);
    }
    console.log('[client-funnel] subscribed', { email, finalBucket, dedup: !!dedupBucket, eventId });

    // Post-process: create Google Calendar event + send notification + send
    // confirmation. All wrapped in Promise.allSettled so failures NEVER affect
    // the response. If Netlify Functions v2 context.waitUntil is available we
    // run it after returning; otherwise we await before returning.
    const postProcess = runBookingPostProcess({
      firstName,
      email,
      phone,
      date,
      time,
      intent,
      mode,
      language,
      finalBucket,
      dedupBucket,
    });

    if (typeof context?.waitUntil === 'function') {
      context.waitUntil(postProcess);
    } else {
      // Functions v1 / older runtime: await so logs still attach to invocation.
      await postProcess;
    }

    return jsonResponse({
      success: true,
      bucket: finalBucket,
      dedup: !!dedupBucket,
      test: false,
    });
  } catch (err) {
    console.error('[client-funnel] error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
};

// ----- post-process: Google Calendar event + notification + confirmation -----

async function runBookingPostProcess({
  firstName, email, phone, date, time, intent, mode, language,
  finalBucket, dedupBucket,
}) {
  // Compute event window from the prospect's submitted date + time.
  // Format expected from client.html: date is an ISO timestamp (toISOString),
  // time is "H:MM" wall-clock in BOOKING_TIMEZONE.
  let startISO = null;
  let endISO = null;
  try {
    if (date && time) {
      const parsed = parseBookingDateTime(date, time, BOOKING_TIMEZONE);
      if (parsed) {
        startISO = parsed.startISO;
        endISO = parsed.endISO;
      }
    }
  } catch (err) {
    console.error('[client-funnel] post-process: bad date/time, skipping calendar', err?.message || err);
  }

  const displayDate = formatBookingDate(date, BOOKING_TIMEZONE, language);
  const displayTime = time || '';

  let calendarEventLink = null;
  let calendarEventId = null;

  // 1) Create the Google Calendar event (only if we have a valid window)
  if (startISO && endISO) {
    try {
      const summary = `Discovery Call: ${firstName || email}`;
      const descriptionLines = [
        `New booking from /client funnel.`,
        ``,
        `Name: ${firstName || '(not provided)'}`,
        `Email: ${email}`,
        `Phone: ${phone || '(not provided)'}`,
        `Intent: ${intent}`,
        `Mode: ${mode}`,
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
      console.log(`[client-funnel] calendar event created: ${calendarEventId}`);
    } catch (err) {
      console.error(`[client-funnel] post-process error: calendar ${err?.message || err}`);
    }
  } else {
    console.log('[client-funnel] post-process: no date/time, skipping calendar event');
  }

  // 2) Email Laura + email prospect + welcome (first-scan only) in parallel.
  //
  // Prospect-facing email rules:
  //   LOCAL + first scan + booking  → MERGED welcome (booking baked in). NO separate confirmation.
  //   LOCAL + dedupe   + booking    → standalone confirmation (welcome already sent on first scan).
  //   LOCAL + first scan + NO slot  → welcome only (defensive fallback rendering).
  //   ONLINE + first scan           → welcome only (no booking line, original CTA to /client).
  //   ONLINE + dedupe               → nothing to the prospect (already welcomed, no slot to confirm).
  //
  // The welcome email is the bucket's tailored content; for local buckets it
  // now includes the booking confirmation line and a calendar-event CTA.
  const hasBooking = !!(startISO && endISO);
  const isLocalBucket = finalBucket === 'dance-local' || finalBucket === 'train-local';
  const sendWelcome = !dedupBucket && !!finalBucket;
  // Standalone confirmation only fires when (a) we have a booking AND (b) the
  // welcome email was NOT already sent in this same run for a local bucket.
  // i.e. dedupe re-scans of a local-bucket prospect get the bare "you're
  // booked" confirmation; everyone else either gets the merged welcome
  // (covers it) or no slot (skip).
  const sendConfirmation = hasBooking && !(sendWelcome && isLocalBucket);

  const tasks = [
    sendBookingNotification({
      prospectName: firstName,
      prospectEmail: email,
      prospectPhone: phone,
      date: displayDate || date,
      time: displayTime,
      intent,
      mode,
      language,
      calendarEventLink,
    }),
  ];
  if (sendConfirmation) {
    tasks.push(sendBookingConfirmation({
      prospectName: firstName,
      prospectEmail: email,
      date: displayDate || date,
      time: displayTime,
      language,
      calendarEventLink,
    }));
  }
  if (sendWelcome) {
    tasks.push(sendWelcomeEmail({
      bucket: finalBucket,
      prospectName: firstName,
      prospectEmail: email,
      language,
      // Local-bucket welcome templates render booking date/time/link inline.
      // Online buckets ignore these (their templates have no placeholders).
      bookingDate: displayDate || date,
      bookingTime: displayTime,
      calendarEventLink,
    }));
  }

  const results = await Promise.allSettled(tasks);

  // Order in results matches order in tasks: notify, [confirm?], [welcome?]
  let cursor = 0;
  const notifyResult = results[cursor++];
  const confirmResult = sendConfirmation ? results[cursor++] : null;
  const welcomeResult = sendWelcome ? results[cursor++] : null;

  if (notifyResult.status === 'fulfilled') {
    console.log('[client-funnel] email to laura: ok');
  } else {
    console.error(`[client-funnel] post-process error: email-laura ${notifyResult.reason?.message || notifyResult.reason}`);
  }
  if (sendConfirmation) {
    if (confirmResult.status === 'fulfilled') {
      console.log('[client-funnel] standalone confirmation email to prospect: ok');
    } else {
      console.error(`[client-funnel] post-process error: email-prospect ${confirmResult.reason?.message || confirmResult.reason}`);
    }
  } else if (hasBooking && sendWelcome && isLocalBucket) {
    console.log('[client-funnel] standalone confirmation skipped (merged into local-bucket welcome)');
  } else {
    console.log('[client-funnel] standalone confirmation skipped (no slot picked)');
  }
  if (sendWelcome) {
    if (welcomeResult.status === 'fulfilled') {
      console.log(`[client-funnel] welcome email to ${email} (${finalBucket}): ok`);
    } else {
      console.error(`[client-funnel] welcome email to ${email} (${finalBucket}): failed: ${welcomeResult.reason?.message || welcomeResult.reason}`);
    }
  } else {
    console.log(`[client-funnel] welcome email skipped (dedup=${!!dedupBucket}, bucket=${finalBucket || 'none'})`);
  }
}

// Convert client-side ISO date + "H:MM" time string + timezone into a 15-min
// event window. Returns null if either input is unparseable.
function parseBookingDateTime(dateISO, timeStr, tz) {
  const d = new Date(dateISO);
  if (isNaN(d.getTime())) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(timeStr.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  // Pull YMD in the target timezone for the supplied date.
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
  const [y, mo, dy] = ymd.split('-').map(Number);

  const fakeUtc = Date.UTC(y, mo - 1, dy, hour, minute, 0);
  const offsetMin = tzOffsetMinutes(new Date(fakeUtc), tz);
  const realUtc = fakeUtc - offsetMin * 60 * 1000;
  const start = new Date(realUtc);
  const end = new Date(realUtc + 15 * 60 * 1000);
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

function formatBookingDate(dateISO, tz, language) {
  if (!dateISO) return '';
  const d = new Date(dateISO);
  if (isNaN(d.getTime())) return '';
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    timeZone: tz, weekday: 'long', month: 'long', day: 'numeric',
  }).format(d);
}
