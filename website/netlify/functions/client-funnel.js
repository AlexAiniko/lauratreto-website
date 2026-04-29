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

import { getStore } from '@netlify/blobs';

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
