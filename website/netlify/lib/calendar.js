// Calendar helpers: read free/busy + create booking events.
// Uses the shared OAuth2 client from lib/google.js.

import { getGoogleClient } from './google.js';

/**
 * Returns an array of available 15-minute (or slotMinutes) time slots
 * over the next `days` days, computed against Laura's primary calendar
 * busy times. Slots in the past are excluded.
 *
 * Each slot: { startISO, endISO, displayDate, displayTime, time24, weekday }
 *   - time24: wall-clock time in `H:MM` 24-hour format (no leading zero on hour),
 *     in the configured `timezone`. Designed to be submitted back to
 *     client-funnel.js's parseBookingDateTime as `body.time` without conversion.
 */
export async function getAvailableSlots({
  days = 14,
  calendarId = process.env.BOOKING_CALENDAR_ID || 'primary',
  workingHours = { start: 7, end: 19 }, // 7am-7pm local
  slotMinutes = 15,
  bufferMinutes = 15,
  timezone = process.env.BOOKING_TIMEZONE || 'America/New_York',
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

// ---------- timezone helpers ----------

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
