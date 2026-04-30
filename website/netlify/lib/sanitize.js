// Shared sanitization, validation, response, and rate-limit helpers.
// Extracted from client-funnel.js so new functions can reuse them.
// NOTE: existing client-funnel.js still has its own copies for now —
// migrating that is a separate refactor.

const RATE_STATE = new Map();

export function sanitize(text, maxLen = 200) {
  if (typeof text !== 'string') return '';
  return text.replace(/<[^>]*>/g, '').trim().slice(0, maxLen);
}

export function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...extraHeaders,
    },
  });
}

export function rateLimit(ip, max = 30, windowMs = 60000) {
  const now = Date.now();
  const entry = RATE_STATE.get(ip) || { count: 0, reset: now + windowMs };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + windowMs;
  }
  entry.count += 1;
  RATE_STATE.set(ip, entry);
  return entry.count <= max;
}
