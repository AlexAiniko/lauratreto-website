// Stripe webhook receiver. Verifies signatures, dedupes via Netlify Blobs,
// and on checkout.session.completed creates the dance-lesson booking
// (MailerLite + Calendar + Emails) by calling the shared lib helper.
//
// Security boundary: when the Stripe key is a LIVE key (sk_live_* / rk_live_*),
// missing STRIPE_WEBHOOK_SECRET means we cannot verify event authenticity, so
// we refuse to process, period. With a TEST key (sk_test_* / rk_test_*) we log
// a loud warning and skip verification so the function can be wired up and
// smoke-tested before the real secret is registered.
//
// Why prefix-based, not Netlify CONTEXT: Netlify v2 functions do not see
// CONTEXT at runtime, only at build time. The Stripe key prefix is the
// authoritative signal for "are we handling real money right now."
//
// Idempotency: every processed checkout session id is recorded in the
// `stripe-webhook-processed` blob store. A duplicate delivery short-circuits.
//
// Endpoint: /.netlify/functions/stripe-webhook
//
// Env:
//   STRIPE_SECRET_KEY     (required, sk_live_* or rk_live_* in production,
//                          sk_test_* / rk_test_* in deploy-preview)
//   STRIPE_WEBHOOK_SECRET (required when STRIPE_SECRET_KEY is a live key,
//                          optional with a test key)

import Stripe from 'stripe';
import { getStore } from '@netlify/blobs';
import { createDanceLessonBooking } from '../lib/dance-lesson.js';

const PROCESSED_STORE = 'stripe-webhook-processed';

export default async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  const isLiveKey = typeof STRIPE_KEY === 'string' && /^(sk|rk)_live_/.test(STRIPE_KEY);

  if (!STRIPE_KEY) {
    console.error('[stripe-webhook] STRIPE_SECRET_KEY missing');
    return new Response(JSON.stringify({ error: 'misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!WEBHOOK_SECRET && isLiveKey) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not set with a LIVE key, refusing to process unverified events');
    return new Response(
      JSON.stringify({ error: 'STRIPE_WEBHOOK_SECRET not set, webhook events cannot be verified, refusing to process.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Stripe needs the RAW request body for HMAC verification. Reading via
  // request.text() is critical, JSON-parsing first will mutate whitespace
  // and the signature comparison will fail.
  let rawBody;
  try {
    rawBody = await request.text();
  } catch (err) {
    console.error('[stripe-webhook] failed to read raw body:', err?.message || err);
    return new Response(JSON.stringify({ error: 'bad request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stripe = new Stripe(STRIPE_KEY);
  let event;

  if (WEBHOOK_SECRET) {
    const sig = request.headers.get('stripe-signature') || '';
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, sig, WEBHOOK_SECRET);
    } catch (err) {
      console.error('[stripe-webhook] signature verification failed:', err?.message || err);
      return new Response(JSON.stringify({ error: 'invalid signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else {
    // Test-key fallback: parse the JSON body but flag it loudly. Never reach
    // this branch with a live key thanks to the guard above.
    console.warn('[stripe-webhook] STRIPE_WEBHOOK_SECRET missing with a test key, skipping signature verification');
    try {
      event = JSON.parse(rawBody);
    } catch (err) {
      console.error('[stripe-webhook] failed to parse unverified body:', err?.message || err);
      return new Response(JSON.stringify({ error: 'invalid body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const eventType = event?.type || 'unknown';
  const eventId = event?.id || 'no-id';
  console.log('[stripe-webhook] received event', { type: eventType, id: eventId });

  try {
    switch (eventType) {
      case 'checkout.session.completed': {
        const session = event.data?.object;
        if (!session?.id) {
          console.warn('[stripe-webhook] checkout.session.completed missing session.id');
          break;
        }
        const dedupKey = session.id;
        let processedStore = null;
        try {
          processedStore = getStore(PROCESSED_STORE);
        } catch (err) {
          console.warn('[stripe-webhook] blob store unavailable, skipping dedup:', err?.message || err);
        }
        if (processedStore) {
          const existing = await processedStore.get(dedupKey).catch(() => null);
          if (existing) {
            console.log(`[stripe-webhook] duplicate webhook for session ${dedupKey}, skipping`);
            break;
          }
        }
        await handleCheckoutCompleted(session);
        if (processedStore) {
          try {
            await processedStore.set(dedupKey, JSON.stringify({
              processed_at: new Date().toISOString(),
              event_id: eventId,
            }));
          } catch (err) {
            console.warn('[stripe-webhook] failed to write dedup blob:', err?.message || err);
          }
        }
        break;
      }
      case 'checkout.session.expired': {
        const sid = event.data?.object?.id || 'unknown';
        console.log(`[stripe-webhook] session expired: ${sid}, no action`);
        break;
      }
      case 'payment_intent.payment_failed': {
        const pid = event.data?.object?.id || 'unknown';
        console.log(`[stripe-webhook] payment failed: ${pid}, no action`);
        break;
      }
      default:
        console.log(`[stripe-webhook] unhandled event type: ${eventType}`);
    }
  } catch (err) {
    // Log and rethrow, do not return 200, so Stripe retries. Stripe retries
    // checkout.session.completed for up to 3 days with backoff.
    console.error('[stripe-webhook] handler error:', err?.message || err);
    return new Response(JSON.stringify({ error: 'handler error', message: err?.message || String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

async function handleCheckoutCompleted(session) {
  const meta = session.metadata || {};
  const kind = meta.kind || '';

  // Only act on dance-lesson sessions. Future product types (memberships,
  // packages) will set their own kind and route here without breaking the
  // dance-lesson path.
  if (kind !== 'dance-lesson-booking') {
    console.log(`[stripe-webhook] checkout.session.completed kind="${kind}", not a dance-lesson booking, skipping`);
    return;
  }

  const paymentStatus = session.payment_status || 'unknown';
  if (paymentStatus !== 'paid') {
    console.warn(`[stripe-webhook] session ${session.id} payment_status=${paymentStatus}, refusing to create booking`);
    return;
  }

  const tier = meta.tier;
  const firstName = meta.first_name || '';
  const email = (meta.email || session.customer_details?.email || '').toLowerCase();
  const notes = meta.notes || '';
  const language = meta.language || 'en';
  const date = meta.booking_date || '';
  const time = meta.booking_time || '';
  const meetingMethod = meta.meeting_method || 'in-person';
  const amountPaidCents = session.amount_total ?? null;

  if (!email || !tier || !date || !time) {
    console.error(`[stripe-webhook] session ${session.id} missing required metadata`, { tier, email: !!email, date, time });
    throw new Error(`incomplete metadata on session ${session.id}`);
  }

  console.log(`[stripe-webhook] creating booking for session ${session.id}`, {
    tier, email, date, time,
  });

  const result = await createDanceLessonBooking({
    tier,
    firstName,
    email,
    notes,
    language,
    date,
    time,
    meetingMethod,
    stripeSessionId: session.id,
    amountPaidCents,
  });

  if (result.errors && result.errors.length) {
    console.warn(`[stripe-webhook] booking ${session.id} completed with non-fatal errors:`, result.errors);
  } else {
    console.log(`[stripe-webhook] booking ${session.id} fully processed`);
  }
}

export const config = {
  path: '/.netlify/functions/stripe-webhook',
};
