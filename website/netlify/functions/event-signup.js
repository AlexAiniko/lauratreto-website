// Event RSVP → MailerLite subscribe webhook
// Netlify Function v2 (ES modules)
//
// Receives ChaChaFit event signups, creates-or-updates the subscriber in
// MailerLite, and assigns them to the event-specific group so the
// event-reminder automation can fire.
//
// Deployed at: https://lauratreto.netlify.app/.netlify/functions/event-signup
//
// Required env var (set in Netlify UI):
//   MAILERLITE_API_KEY — MailerLite JWT Bearer token

// ---------------------------------------------------------------------------
// Event → MailerLite group map
// ---------------------------------------------------------------------------
// Extend this map as new events ship. Keep the default pointing to the
// current active event so a missing event_id still routes to something real.
//
// Group IDs can be overridden by Netlify env vars (preferred for prod):
//   MAILERLITE_GROUP_KW_DANCE   → kw-dance-events bucket
const EVENT_GROUPS = {
  'chachafit-fullmoon-may-2026': '185598986321659436', // ChaChaFit: Full Moon May 1 2026
  'kw-dance-events': process.env.MAILERLITE_GROUP_KW_DANCE || '186207950945126028', // /keywest-dancing evergreen list
};
const DEFAULT_EVENT_ID = 'chachafit-fullmoon-may-2026';

// ---------------------------------------------------------------------------
// Very small in-memory rate limiter (per warm instance)
// Functions can cold-start between calls so this is best-effort, not airtight.
// ---------------------------------------------------------------------------
const RATE_LIMIT_MAX = 8;          // max requests
const RATE_LIMIT_WINDOW_MS = 60000; // per 60s window per IP
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

// ---------------------------------------------------------------------------
// Input sanitization
// ---------------------------------------------------------------------------
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

export default async (request, context) => {
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return jsonResponse({ ok: true });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  // Rate limit (best-effort, Netlify sets x-forwarded-for / x-nf-client-connection-ip)
  const ip =
    request.headers.get('x-nf-client-connection-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  if (!rateLimit(ip)) {
    return jsonResponse({ error: 'Too many requests. Try again in a minute.' }, 429);
  }

  const API_KEY = process.env.MAILERLITE_API_KEY;
  if (!API_KEY) {
    console.error('MAILERLITE_API_KEY env var is missing');
    return jsonResponse({ error: 'Server misconfigured' }, 500);
  }

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  // Honeypot: if the hidden field is filled, treat as bot but respond "success"
  // so the bot does not retry or probe.
  const honeypot = sanitize(body.website || body.bot_field || '', 50);
  if (honeypot) {
    console.log('Event signup honeypot tripped from', ip);
    return jsonResponse({ success: true, message: 'Thanks' });
  }

  const email = sanitize(body.email, 120);
  const firstName = sanitize(body.first_name, 60);
  const language = sanitize(body.language, 10) || 'en';
  const wantsFuture = body.future_events === true || body.future_events === 'true' || body.future_events === 'on';
  const eventIdInput = sanitize(body.event_id, 80) || DEFAULT_EVENT_ID;

  if (!isValidEmail(email)) {
    return jsonResponse({ error: 'Invalid email' }, 400);
  }

  const groupId = EVENT_GROUPS[eventIdInput] || EVENT_GROUPS[DEFAULT_EVENT_ID];
  const EVENT_NAMES = {
    'chachafit-fullmoon-may-2026': 'ChaChaFit Full Moon May 1',
    'kw-dance-events': 'KW Dance Events (evergreen)',
  };
  const eventName = EVENT_NAMES[eventIdInput] || eventIdInput;

  // MailerLite upsert: POST /api/subscribers creates or updates by email.
  // Assigning groups[] on the payload is the documented way to add the
  // subscriber to a group, which fires any automation attached to that group.
  const subscriberPayload = {
    email,
    fields: {
      name: firstName || undefined,
      event_name: eventName,
      event_id: eventIdInput,
      language: language,
      future_events_optin: wantsFuture ? 'yes' : 'no',
      source: 'event-signup',
    },
    groups: [groupId],
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
      console.error('MailerLite error:', res.status, JSON.stringify(data));
      return jsonResponse(
        { error: 'Signup service is temporarily unavailable. Please try again.', details: data },
        502
      );
    }

    console.log('Event signup added:', email, '| event:', eventIdInput, '| lang:', language);

    return jsonResponse({
      success: true,
      message:
        language === 'es'
          ? 'Ya estas en la lista. Nos vemos el viernes.'
          : "You're on the list. See you Friday.",
      event_id: eventIdInput,
      subscriber_id: data?.data?.id || null,
    });
  } catch (err) {
    console.error('Event signup error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
};

export const config = {
  path: '/.netlify/functions/event-signup',
};
