// Creates a Stripe Checkout Session for a dance-lesson booking.
// Returns the hosted-checkout URL. The frontend redirects the browser there.
//
// IMPORTANT: this does NOT create a calendar event, send emails, or upsert
// MailerLite. Those side effects are gated on payment success and run from
// stripe-webhook.js when Stripe fires checkout.session.completed.
//
// All booking details are stamped into session.metadata so the webhook can
// recreate the booking without any DB lookup.
//
// Env:
//   STRIPE_SECRET_KEY   live (rk_live_*) on production, test (rk_test_*) on
//                       deploy-previews + branch-deploys. The Stripe SDK
//                       auto-detects mode by key prefix, no flag here.
//
// Endpoint: /.netlify/functions/create-stripe-checkout

import Stripe from 'stripe';
import { sanitize, isValidEmail, jsonResponse, rateLimit } from '../lib/sanitize.js';
import { VALID_TIERS, TIER_META } from '../lib/dance-lesson.js';

const SUCCESS_URL = 'https://lauratreto.com/book-dance-lesson?status=success&session_id={CHECKOUT_SESSION_ID}';
const CANCEL_URL = 'https://lauratreto.com/book-dance-lesson?status=cancel';

const TIER_DESCRIPTION = {
  solo:   '60-min private dance lesson with Laura Treto in Key West.',
  couple: '60-min couple dance lesson with Laura Treto in Key West.',
  group:  '75-min small-group dance lesson (3-6 people) with Laura Treto in Key West.',
};

export default async (request) => {
  if (request.method === 'OPTIONS') return jsonResponse({ ok: true });
  if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'Method Not Allowed' }, 405);

  const ip =
    request.headers.get('x-nf-client-connection-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  if (!rateLimit(ip, 20, 60000)) {
    return jsonResponse({ ok: false, error: 'Too many requests. Try again in a minute.' }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400);
  }

  // Honeypot: silent success, do not create a Stripe session.
  const honeypot = sanitize(body.website || body.bot_field || '', 50);
  if (honeypot) {
    console.log('[create-stripe-checkout] honeypot tripped from', ip);
    return jsonResponse({ ok: true, url: null, skipped: true });
  }

  const tier = sanitize(body.tier || body.lesson_type, 10).toLowerCase();
  const firstName = sanitize(body.first_name, 60);
  const email = sanitize(body.email, 120).toLowerCase();
  const notes = sanitize(body.notes, 280);
  const language = sanitize(body.language, 10) || 'en';
  const date = sanitize(body.date, 80);
  const time = sanitize(body.time, 20);
  const meetingMethod = sanitize(body.meeting_method, 20).toLowerCase() || 'in-person';

  if (!isValidEmail(email)) return jsonResponse({ ok: false, error: 'Invalid email' }, 400);
  if (!firstName) return jsonResponse({ ok: false, error: 'First name required' }, 400);
  if (!VALID_TIERS.has(tier)) return jsonResponse({ ok: false, error: 'Invalid tier' }, 400);
  if (!date || !time) return jsonResponse({ ok: false, error: 'Pick a date and time' }, 400);

  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_KEY) {
    console.error('[create-stripe-checkout] STRIPE_SECRET_KEY missing');
    return jsonResponse({ ok: false, error: 'Payment is not configured. Try again later.' }, 500);
  }

  const stripe = new Stripe(STRIPE_KEY);
  const tierMeta = TIER_META[tier];
  const tierLabel = tierMeta.label;
  const description = TIER_DESCRIPTION[tier] || tierLabel;

  // Stripe metadata has a 500-char limit per value, plus a 50-key max. Trim
  // notes hard so we never blow past it. Field count well under 50.
  const trimmedNotes = (notes || '').slice(0, 480);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Dance Lesson, ${tierLabel}`,
              description,
            },
            unit_amount: tierMeta.priceCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind: 'dance-lesson-booking',
        tier,
        first_name: firstName,
        email,
        notes: trimmedNotes,
        language,
        booking_date: date,
        booking_time: time,
        meeting_method: meetingMethod,
      },
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
    });

    console.log('[create-stripe-checkout] session created', {
      session_id: session.id,
      tier,
      email,
      amount: tierMeta.priceCents,
    });

    return jsonResponse({
      ok: true,
      url: session.url,
      session_id: session.id,
    });
  } catch (err) {
    const msg = err?.message || String(err);
    console.error('[create-stripe-checkout] stripe error:', msg);
    // Stripe API errors get 502 (upstream), our own validation has already
    // returned 4xx above. Bubble the Stripe message but keep it short.
    return jsonResponse(
      { ok: false, error: `Payment provider error: ${msg.slice(0, 200)}` },
      502
    );
  }
};

export const config = {
  path: '/.netlify/functions/create-stripe-checkout',
};
