// Calendar helpers: read free/busy + create booking events.
// Uses the shared OAuth2 client from lib/google.js.

import { getGoogleClient } from './google.js';

/**
 * Returns an array of available 15-minute (or slotMinutes) time slots
 * over the next `days` days, computed against Laura's primary calendar
 * busy times. Slots in the past are excluded.
 *
 * Working hours default to 9am-7pm local (last slot starts 6:45pm, ends 7:00pm)
 * and weekends (Sun + Sat) are skipped by default. Both are env-var driven:
 *   - BOOKING_HOURS:     "9-19"  (start-end, 24-hour, end-exclusive)
 *   - BOOKING_SKIP_DAYS: "0,6"   (comma-separated weekday nums, 0=Sun..6=Sat)
 * Malformed or missing env vars fall back to those same defaults.
 *
 * Each slot: { startISO, endISO, displayDate, displayTime, time24, weekday }
 *   - time24: wall-clock time in `H:MM` 24-hour format (no leading zero on hour),
 *     in the configured `timezone`. Designed to be submitted back to
 *     client-funnel.js's parseBookingDateTime as `body.time` without conversion.
 */
export async function getAvailableSlots({
  days = 14,
  calendarId = process.env.BOOKING_CALENDAR_ID || 'primary',
  workingHours = parseBookingHours(process.env.BOOKING_HOURS, { start: 9, end: 19 }),
  slotMinutes = 15,
  bufferMinutes = 15,
  timezone = process.env.BOOKING_TIMEZONE || 'America/New_York',
  skipDays = parseSkipDays(process.env.BOOKING_SKIP_DAYS, new Set([0, 6])),
} = {}) {
  const { calendar } = getGoogleClient();

  const now = new Date();
  const windowStart = new Date(now.getTime() + 60 * 1000); // now + 1 minute
  const windowEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const fb = await calendar.freebusy.query({
    requestBody: {
      timeMin: windowStart.toISOString(),
      timeMax: windowEnd.toISOString(),
      timeZone: timezone,
      items: [{ id: calendarId }],
    },
  });

  const busyRanges = (fb.data?.calendars?.[calendarId]?.busy || []).map((b) => ({
    start: new Date(b.start).getTime(),
    end: new Date(b.end).getTime(),
  }));

  // Build candidate working-hour slots in the configured timezone for each day.
  const slots = [];
  const slotMs = slotMinutes * 60 * 1000;
  const bufMs = bufferMinutes * 60 * 1000;

  // Iterate day-by-day starting today (in the configured timezone)
  for (let dayOffset = 0; dayOffset <= days; dayOffset++) {
    const dayDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const ymd = formatYMDInTz(dayDate, timezone);

    // Skip configured weekdays (default Sun + Sat). Use the timezone-aware
    // weekday so an instant late on Friday ET doesn't get bucketed as Saturday.
    const weekdayNum = getWeekdayInTz(ymd, timezone);
    if (skipDays.has(weekdayNum)) continue;

    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += slotMinutes) {
        const slotStart = isoFromYMDHMTz(ymd, hour, minute, timezone);
        const slotEnd = new Date(new Date(slotStart).getTime() + slotMs);
        const slotStartMs = new Date(slotStart).getTime();
        const slotEndMs = slotEnd.getTime();

        if (slotStartMs < windowStart.getTime()) continue; // past
        if (slotEndMs > windowEnd.getTime()) continue;

        // A slot conflicts with a busy block when:
        //   (a) the slot's start falls inside the buffered busy window
        //       [busyStart - buffer, busyEnd + buffer]  (inclusive boundaries
        //       — a slot that *just touches* the buffer is also excluded), OR
        //   (b) the slot otherwise overlaps the raw busy range (covers the
        //       case where slot length > buffer, e.g. a long busy block).
        // For a busy block [9:00, 9:30] with buffer=15, this excludes slots
        // starting at 8:45, 9:00, 9:15, 9:30, 9:45 — and *includes* 8:30
        // (start before buffer window) and 10:00 (start after buffer window).
        const conflicts = busyRanges.some((b) => {
          const inBufferedStart =
            slotStartMs >= b.start - bufMs && slotStartMs <= b.end + bufMs;
          const overlapsRaw =
            slotStartMs < b.end && slotEndMs > b.start;
          return inBufferedStart || overlapsRaw;
        });
        if (conflicts) continue;

        const display = formatDisplay(slotStart, timezone);
        slots.push({
          startISO: slotStart,
          endISO: slotEnd.toISOString(),
          displayDate: display.date,
          displayTime: display.time,
          time24: formatTime24(slotStart, timezone),
          weekday: display.weekday,
        });
      }
    }
  }

  return slots;
}

/**
 * Creates an event on the configured calendar with attendee invite + ICS
 * delivered via Google's native sendUpdates: 'all'.
 * Returns the created event resource.
 */
export async function createBookingEvent({
  summary,
  description,
  startISO,
  endISO,
  attendeeEmail,
  attendeeName,
  calendarId = process.env.BOOKING_CALENDAR_ID || 'primary',
  timezone = process.env.BOOKING_TIMEZONE || 'America/New_York',
}) {
  const { calendar } = getGoogleClient();

  const res = await calendar.events.insert({
    calendarId,
    sendUpdates: 'all',
    requestBody: {
      summary,
      description,
      start: { dateTime: startISO, timeZone: timezone },
      end: { dateTime: endISO, timeZone: timezone },
      attendees: attendeeEmail
        ? [{ email: attendeeEmail, displayName: attendeeName || attendeeEmail }]
        : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
    },
  });

  return res.data;
}

// ---------- env parsers ----------

// Parses BOOKING_HOURS like "9-19" -> { start: 9, end: 19 }.
// Falls back to `fallback` if missing, malformed, or out of range.
function parseBookingHours(raw, fallback) {
  if (!raw || typeof raw !== 'string') return fallback;
  const m = raw.trim().match(/^(\d{1,2})\s*-\s*(\d{1,2})$/);
  if (!m) return fallback;
  const start = Number(m[1]);
  const end = Number(m[2]);
  if (!Number.isInteger(start) || !Number.isInteger(end)) return fallback;
  if (start < 0 || start > 23 || end < 1 || end > 24) return fallback;
  if (end <= start) return fallback;
  return { start, end };
}

// Parses BOOKING_SKIP_DAYS like "0,6" -> Set{0, 6}.
// Falls back to `fallback` if missing or no valid weekday numbers found.
function parseSkipDays(raw, fallback) {
  if (!raw || typeof raw !== 'string') return fallback;
  const out = new Set();
  for (const part of raw.split(',')) {
    const n = Number(part.trim());
    if (Number.isInteger(n) && n >= 0 && n <= 6) out.add(n);
  }
  return out.size ? out : fallback;
}

// ---------- timezone helpers ----------

// Returns the weekday (0=Sun..6=Sat) for the given YYYY-MM-DD in `tz`.
// Anchors at 12:00 local that day (well clear of DST transitions) and reads
// the weekday short-name in `tz`, then maps it. This avoids the bug where
// using `new Date(ymd)` parses as UTC midnight and shifts by a day in
// negative-offset zones.
function getWeekdayInTz(ymd, tz) {
  const [y, m, d] = ymd.split('-').map(Number);
  // Anchor at noon UTC for the date — converting to any IANA zone keeps the
  // calendar date intact (no DST gap can swing a noon by 12+ hours).
  const anchor = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const short = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
  }).format(anchor);
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[short];
}

// Returns 'YYYY-MM-DD' for `date` in `tz`.
function formatYMDInTz(date, tz) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

// Given a YMD, hour, minute, and tz, returns an ISO8601 string with the
// correct UTC offset for that wall-clock time in that tz.
function isoFromYMDHMTz(ymd, hour, minute, tz) {
  const [y, m, d] = ymd.split('-').map(Number);
  // Pretend the wall-clock time is UTC, then compute the offset between
  // that "fake UTC" and the real wall-clock representation in tz.
  const fakeUtc = Date.UTC(y, m - 1, d, hour, minute, 0);
  const offsetMin = getTzOffsetMinutes(new Date(fakeUtc), tz);
  const realUtc = fakeUtc - offsetMin * 60 * 1000;
  return new Date(realUtc).toISOString();
}

// Returns the offset (in minutes) of `tz` from UTC for the given instant.
// Positive = ahead of UTC, negative = behind.
function getTzOffsetMinutes(date, tz) {
  // Format the date in tz, parse back, diff against the UTC representation.
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(date).map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return Math.round((asUtc - date.getTime()) / 60000);
}

// Returns wall-clock time in `H:MM` 24-hour format (no leading zero on hour)
// for the given ISO instant in tz. e.g. "9:00", "11:30", "14:00", "16:30".
function formatTime24(iso, tz) {
  const d = new Date(iso);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(d).map((p) => [p.type, p.value])
  );
  const hour = String(Number(parts.hour)); // strip leading zero
  return `${hour}:${parts.minute}`;
}

function formatDisplay(iso, tz) {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d);
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
  }).format(d);
  return { date, time, weekday };
}
