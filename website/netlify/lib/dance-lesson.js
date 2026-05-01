// Shared booking creator for the tourist dance-lesson flow.
// Extracted from the original book-dance-lesson.js so the Stripe webhook can
// reuse the exact same MailerLite + Calendar + Email post-process. No payment
// logic here, this only handles the side effects after a booking is confirmed.

import { createBookingEvent } from './calendar.js';
import { sendDanceLessonConfirmation, sendDanceLessonNotification } from './email.js';

const BOOKING_TIMEZONE = process.env.BOOKING_TIMEZONE || 'America/New_York';
const KW_DANCE_GROUP = process.env.MAILERLITE_GROUP_KW_DANCE || '186207950945126028';
// MailerLite uses Groups (not Tags) for segmentation in the Connect API.
// `dance-lesson-booked` is a group, not a tag, same intent (segment all
// bookers regardless of tier so an automation can fire), surfaced via the
// MailerLite API contract that actually exists.
const DANCE_BOOKED_GROUP = process.env.MAILERLITE_GROUP_DANCE_BOOKED || '186211048518321222';

export const VALID_TIERS = new Set(['solo', 'couple', 'group']);

export const TIER_META = {
  solo:   { label: 'Solo Lesson',   price: '$150', priceCents: 15000, durationMin: 60 },
  couple: { label: 'Couple Lesson', price: '$200', priceCents: 20000, durationMin: 60 },
  group:  { label: 'Small Group',   price: '$300', priceCents: 30000, durationMin: 75 },
};

/**
 * Creates a dance-lesson booking: MailerLite upsert, Google Calendar event,
 * confirmation email to prospect, notification email to laura@.
 *
 * Args:
 *   tier:       'solo' | 'couple' | 'group'
 *   firstName:  string
 *   email:      string (already lowercased + validated)
 *   notes:      string (already sanitized)
 *   language:   'en' | 'es'
 *   date:       ISO string for the slot start (used for parsing + display)
 *   time:       'H:MM' 24-hour wall-clock string in BOOKING_TIMEZONE
 *   meetingMethod: 'in-person' | 'call' (dance lessons default to in-person)
 *   stripeSessionId: optional, included in the calendar event description
 *   amountPaidCents: optional, included in the laura@ notification
 *
 * Returns:
 *   { subscriberId, calendarEventId, calendarEventLink, errors[] }
 *   errors[] is non-empty if any post-process step failed. The caller decides
 *   whether to surface these. Calendar + email failures never throw, they are
 *   logged and pushed onto errors[].
 */
export async function createDanceLessonBooking({
  tier,
  firstName,
  email,
  notes,
  language,
  date,
  time,
  meetingMethod = 'in-person',
  stripeSessionId = null,
  amountPaidCents = null,
}) {
  const errors = [];

  if (!VALID_TIERS.has(tier)) {
    throw new Error(`createDanceLessonBooking: invalid tier "${tier}"`);
  }
  if (!email) {
    throw new Error('createDanceLessonBooking: email required');
  }

  const tierMeta = TIER_META[tier];

  // ---------- 1) MailerLite upsert ----------
  const API_KEY = process.env.MAILERLITE_API_KEY;
  let subscriberId = null;

  if (!API_KEY) {
    const msg = 'MAILERLITE_API_KEY missing';
    console.error('[dance-lesson]', msg);
    errors.push({ step: 'mailerlite', message: msg });
  } else {
    const subscriberPayload = {
      email,
      fields: {
        name: firstName || undefined,
        lesson_type: tier,
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
        const msg = `MailerLite ${res.status}: ${JSON.stringify(data)}`;
        console.error('[dance-lesson]', msg);
        errors.push({ step: 'mailerlite', message: msg });
      } else {
        subscriberId = data?.data?.id || null;
        console.log('[dance-lesson] subscribed', { email, tier, subscriberId });
      }
    } catch (err) {
      const msg = `mailerlite fetch error: ${err?.message || err}`;
      console.error('[dance-lesson]', msg);
      errors.push({ step: 'mailerlite', message: msg });
    }
  }

  // ---------- 2) Google Calendar event ----------
  let startISO = null;
  let endISO = null;
  try {
    if (date && time) {
      const parsed = parseBookingDateTime(date, time, BOOKING_TIMEZONE, tierMeta.durationMin);
      if (parsed) {
        startISO = parsed.startISO;
        endISO = parsed.endISO;
      }
    }
  } catch (err) {
    console.error('[dance-lesson] parse date/time failed:', err?.message || err);
  }

  const displayDate = formatBookingDate(date, BOOKING_TIMEZONE);
  const displayTime = time || '';

  let calendarEventId = null;
  let calendarEventLink = null;

  if (startISO && endISO) {
    try {
      const summary = `Dance Lesson: ${tierMeta.label}, ${firstName || email}`;
      const descriptionLines = [
        `New dance lesson booking from /book-dance-lesson.`,
        ``,
        `Tier: ${tierMeta.label} (${tierMeta.price}, ${tierMeta.durationMin} min)`,
        `Name: ${firstName || '(not provided)'}`,
        `Email: ${email}`,
        `Notes: ${notes || '(none)'}`,
        `Language: ${language}`,
      ];
      if (stripeSessionId) {
        descriptionLines.push(``, `Stripe session: ${stripeSessionId}`);
      }
      if (amountPaidCents != null) {
        descriptionLines.push(`Paid: $${(amountPaidCents / 100).toFixed(2)}`);
      }
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
      console.log(`[dance-lesson] calendar event created: ${calendarEventId}`);
    } catch (err) {
      const msg = `calendar create failed: ${err?.message || err}`;
      console.error('[dance-lesson]', msg);
      errors.push({ step: 'calendar', message: msg });
    }
  } else {
    errors.push({ step: 'calendar', message: 'date/time missing or unparseable, calendar skipped' });
  }

  // ---------- 3) Emails ----------
  const emailTasks = [
    sendDanceLessonNotification({
      prospectName: firstName,
      prospectEmail: email,
      lessonType: tier,
      date: displayDate || date,
      time: displayTime,
      language,
      notes,
      calendarEventLink,
    }),
    sendDanceLessonConfirmation({
      prospectName: firstName,
      prospectEmail: email,
      lessonType: tier,
      date: displayDate || date,
      time: displayTime,
      language,
      notes,
      calendarEventLink,
    }),
  ];

  const results = await Promise.allSettled(emailTasks);
  const [notifyResult, confirmResult] = results;
  if (notifyResult.status === 'fulfilled') {
    console.log('[dance-lesson] email to laura: ok');
  } else {
    const msg = `email-laura failed: ${notifyResult.reason?.message || notifyResult.reason}`;
    console.error('[dance-lesson]', msg);
    errors.push({ step: 'email-laura', message: msg });
  }
  if (confirmResult.status === 'fulfilled') {
    console.log('[dance-lesson] email to prospect: ok');
  } else {
    const msg = `email-prospect failed: ${confirmResult.reason?.message || confirmResult.reason}`;
    console.error('[dance-lesson]', msg);
    errors.push({ step: 'email-prospect', message: msg });
  }

  return { subscriberId, calendarEventId, calendarEventLink, errors };
}

// ---------- helpers (mirrored from the original book-dance-lesson.js) ----------

function parseBookingDateTime(dateISO, timeStr, tz, durationMinutes) {
  const d = new Date(dateISO);
  if (isNaN(d.getTime())) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(timeStr).trim());
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
