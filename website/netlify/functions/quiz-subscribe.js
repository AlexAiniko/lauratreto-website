// Quiz → MailerLite subscribe webhook
// Netlify Function v2 (ES modules)
//
// Receives quiz submissions, routes to the correct Movement tier group in
// MailerLite, and triggers the "Laura Treto" welcome automation.
//
// Deployed at: https://lauratreto.netlify.app/.netlify/functions/quiz-subscribe
//
// Required env var (set in Netlify UI):
//   MAILERLITE_API_KEY — MailerLite JWT Bearer token

// ---------------------------------------------------------------------------
// MailerLite group IDs — one per Movement tier
// ---------------------------------------------------------------------------
const GROUPS = {
  strong:    '183920013494715736', // Movement Strong      (score 80+)
  ready:     '183920043173610749', // Movement Ready       (score 60-79)
  rebuilder: '183920066955314528', // Movement Rebuilder   (score 40-59)
  priority:  '183920119905256453', // Movement Priority    (score 0-39)
};

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

// Score → tier key (matches quiz.html logic exactly)
function scoreToTier(score) {
  const n = Number(score);
  if (isNaN(n)) return 'priority';
  if (n >= 80) return 'strong';
  if (n >= 60) return 'ready';
  if (n >= 40) return 'rebuilder';
  return 'priority';
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

  const email = sanitize(body.email, 120);
  const firstName = sanitize(body.first_name, 60);
  const score = Number(body.score);
  const weakestAreas = sanitize(body.weakest_areas || body.weakest, 300);
  const goalTag = sanitize(body.goal_tag, 60);
  const language = sanitize(body.language, 10) || 'en';

  if (!isValidEmail(email)) {
    return jsonResponse({ error: 'Invalid email' }, 400);
  }
  if (isNaN(score)) {
    return jsonResponse({ error: 'Invalid score' }, 400);
  }

  // Determine tier and matching group
  const tierKey = scoreToTier(score);
  const groupId = GROUPS[tierKey];

  // Build MailerLite subscriber payload
  // Using the upsert endpoint: POST /api/subscribers
  // Including groups[] assigns the subscriber to the correct tier group,
  // which triggers the "Laura Treto" welcome automation.
  const subscriberPayload = {
    email,
    fields: {
      name: firstName || undefined,
      movement_score: score,
      movement_tier: tierKey,
      goal_tag: goalTag || undefined,
      weakest_areas: weakestAreas || undefined,
      language: language,
      source: 'quiz',
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
        { error: 'MailerLite request failed', details: data },
        502
      );
    }

    console.log('Quiz subscriber added:', email, '| tier:', tierKey, '| score:', score);

    return jsonResponse({
      success: true,
      tier: tierKey,
      score,
      subscriber_id: data?.data?.id || null,
    });
  } catch (err) {
    console.error('Quiz subscribe error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
};

export const config = {
  path: '/.netlify/functions/quiz-subscribe',
};
