// Tiny GET helper for the /book-dance-lesson?status=success screen.
// Looks up a Stripe Checkout Session by id and returns enough public fields
// to render a confirmation summary (tier, amount, status). No PII beyond
// what the customer just submitted, no metadata leakage.
//
// Endpoint: /.netlify/functions/get-checkout-session?session_id=cs_xxx

import Stripe from 'stripe';
import { jsonResponse, rateLimit } from '../lib/sanitize.js';
import { TIER_META } from '../lib/dance-lesson.js';

export default async (request) => {
  if (request.method === 'OPTIONS') return jsonResponse({ ok: true });
  if (request.method !== 'GET') return jsonResponse({ ok: false, error: 'Method Not Allowed' }, 405);

  const ip =
    request.headers.get('x-nf-client-connection-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  if (!rateLimit(ip, 30, 60000)) {
    return jsonResponse({ ok: false, error: 'Too many requests' }, 429);
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id') || '';
  if (!/^cs_(test|live)_[A-Za-z0-9_]+$/.test(sessionId)) {
    return jsonResponse({ ok: false, error: 'Invalid session_id' }, 400);
  }

  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_KEY) {
    return jsonResponse({ ok: false, error: 'Stripe not configured' }, 500);
  }

  const stripe = new Stripe(STRIPE_KEY);
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const tier = session.metadata?.tier || null;
    const tierLabel = tier && TIER_META[tier] ? TIER_META[tier].label : null;
    return jsonResponse({
      ok: true,
      tier,
      tier_label: tierLabel,
      amount_total: session.amount_total ?? null,
      currency: session.currency || 'usd',
      payment_status: session.payment_status || 'unknown',
      customer_email: session.customer_details?.email || session.customer_email || null,
      booking_date: session.metadata?.booking_date || null,
      booking_time: session.metadata?.booking_time || null,
    });
  } catch (err) {
    console.error('[get-checkout-session] retrieve failed:', err?.message || err);
    return jsonResponse({ ok: false, error: 'Session not found' }, 404);
  }
};

export const config = {
  path: '/.netlify/functions/get-checkout-session',
};
