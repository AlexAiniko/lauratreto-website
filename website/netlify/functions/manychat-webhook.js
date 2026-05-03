// ManyChat-to-Claude Webhook for Laura Treto Coaching
// Netlify Function v2 (ES modules): receives DM via ManyChat External Request,
// generates a response via Claude, returns it for ManyChat to send.
//
// Deployed at: https://lauratreto.netlify.app/.netlify/functions/manychat-webhook
//
// Required env vars (set in Netlify UI):
//   ANTHROPIC_API_KEY - Anthropic API key
//   MANYCHAT_API_KEY  - ManyChat API token (Settings → API in ManyChat dashboard).
//                       Used to apply subscriber tags for funnel segmentation.
//                       If unset, tagging is skipped silently (DM replies still work).

import { getStore } from "@netlify/blobs";
import { createHash } from "crypto";

// ---------------------------------------------------------------------------
// Kill switch. Set to true to immediately disable all webhook responses.
// When PAUSED, the webhook returns an empty claude_response so ManyChat
// skips sending a DM. Useful for maintenance or emergencies.
// ---------------------------------------------------------------------------
const PAUSED = false;

// ---------------------------------------------------------------------------
// Conversation history settings
// ---------------------------------------------------------------------------
const MAX_HISTORY_MESSAGES = 15; // Keep last 15 messages (user + assistant combined)

// ---------------------------------------------------------------------------
// Rate limiting (in-memory, resets on cold start — fine for basic protection)
// ---------------------------------------------------------------------------
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;              // max requests per window per subscriber

// Map<subscriberId, { count: number, windowStart: number }>
const rateLimitStore = new Map();

function isRateLimited(subscriberId) {
  const now = Date.now();
  const entry = rateLimitStore.get(subscriberId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitStore.set(subscriberId, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count += 1;
  return false;
}

// ---------------------------------------------------------------------------
// Input sanitization
// ---------------------------------------------------------------------------
const MAX_MESSAGE_LENGTH = 500;

function sanitizeMessage(text) {
  if (typeof text !== 'string') return '';
  // Strip HTML tags
  let clean = text.replace(/<[^>]*>/g, '');
  // Trim whitespace
  clean = clean.trim();
  // Enforce max length
  if (clean.length > MAX_MESSAGE_LENGTH) {
    clean = clean.slice(0, MAX_MESSAGE_LENGTH);
  }
  return clean;
}

// ---------------------------------------------------------------------------
// Non-text input detection
// ---------------------------------------------------------------------------
// When a user sends a voice note, image, video, sticker, GIF, or any
// attachment on Instagram, ManyChat fills last_input_text with either an
// empty value, a CDN URL, or a placeholder token. Passing any of these to
// Claude produces robotic apologies ("I can't open that link/file/audio…")
// that out the bot as not-Laura. This detector is deliberately aggressive:
// better to go silent and let Laura handle manually than to ship a robot
// reply.
function isNonTextInput(text) {
  if (typeof text !== 'string') return true;
  const trimmed = text.trim();
  if (!trimmed) return true;

  const lower = trimmed.toLowerCase();

  // Single URL only (no other content)
  if (/^https?:\/\/\S+$/i.test(trimmed)) return true;

  // Predominantly a URL with minimal surrounding text (>80% URL)
  const urlMatch = trimmed.match(/https?:\/\/\S+/i);
  if (urlMatch && urlMatch[0].length / trimmed.length > 0.8) return true;

  // Instagram / Facebook CDN hostnames appearing anywhere in the message
  const cdnHosts = [
    'scontent.cdninstagram.com',
    'scontent.fbcdn.net',
    'cdn.fbsbx.com',
    'lookaside.fbsbx.com'
  ];
  for (const host of cdnHosts) {
    if (lower.includes(host)) return true;
  }

  // Bracketed media placeholder tokens (ManyChat + variants)
  const bracketPlaceholders = [
    '[audio]', '[voice]', '[image]', '[img]', '[video]', '[file]',
    '[attachment]', '[sticker]', '[gif]', '[photo]', '[media]'
  ];
  for (const p of bracketPlaceholders) {
    if (lower.includes(p)) return true;
  }

  // Angle-bracket media tokens
  if (/<(audio|image|img|video|file|attachment|sticker|gif|photo|media)[\s>]/i.test(trimmed)) {
    return true;
  }

  // Standalone media-word messages (exactly the word, possibly with "message")
  const standalonePatterns = [
    /^audio( message)?$/i,
    /^voice( message| note)?$/i,
    /^image$/i,
    /^photo$/i,
    /^picture$/i,
    /^video( message)?$/i,
    /^gif$/i,
    /^sticker$/i,
    /^attachment$/i,
    /^file$/i,
    /^media$/i
  ];
  for (const pat of standalonePatterns) {
    if (pat.test(trimmed)) return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Resource URLs — single source of truth. NEVER passed to the LLM directly.
// The model uses [LINK:key] placeholders; injectUrls() replaces them after
// generation. This prevents URL hallucination entirely.
// ---------------------------------------------------------------------------
const RESOURCE_URLS = {
  'website':  'https://lauratreto.com',
  'quiz':     'https://lauratreto.com/quiz.html',
  'guide_en': 'https://gamma.app/docs/97qjx7tu5a9po9q',
  'guide_es': 'https://gamma.app/docs/ktdyherfoyy3na8'
};

function injectUrls(text) {
  return text.replace(/\[LINK:(\w+)\]/g, (match, key) => {
    return RESOURCE_URLS[key] || match;
  });
}

// ---------------------------------------------------------------------------
// Markdown sanitization — Instagram does not render markdown
// ---------------------------------------------------------------------------
function stripMarkdown(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')        // **bold** → bold
    .replace(/\*([^*]+)\*/g, '$1')             // *italic* → italic
    .replace(/^[-*+] /gm, '• ')               // list bullets → simple bullet
    .replace(/^#{1,6}\s+/gm, '')              // headers → plain text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // [text](url) → text
}

// ---------------------------------------------------------------------------
// ManyChat subscriber tagging — funnel segmentation
// ---------------------------------------------------------------------------
// Calls POST https://api.manychat.com/fb/subscriber/addTagByName to apply a
// tag to the subscriber. Failures are caught and logged; they NEVER break the
// DM reply flow. If MANYCHAT_API_KEY is unset, this no-ops silently.
//
// Suggested tags (funnel stages):
//   lead_pricing           — asked about cost, price, how much
//   lead_quiz_complete     — completed the movement quiz
//   lead_booking_interest  — asked to book, schedule, sign up
//   lead_desk_pain         — mentioned desk/sitting/posture/back pain
//   lead_general_inquiry   — generic curiosity, no strong signal yet
// ---------------------------------------------------------------------------

async function tagSubscriber(subscriberId, tag) {
  const token = process.env.MANYCHAT_API_KEY;
  if (!token) {
    console.log(`[tag-skip] MANYCHAT_API_KEY not set; skipping tag=${tag} sub=${subscriberId}`);
    return;
  }
  if (!subscriberId || subscriberId === 'unknown' || !tag) {
    console.log(`[tag-skip] missing sub/tag; sub=${subscriberId} tag=${tag}`);
    return;
  }
  try {
    const res = await fetch('https://api.manychat.com/fb/subscriber/addTagByName', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscriber_id: subscriberId,
        tag_name: tag
      })
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[tag-fail] status=${res.status} sub=${subscriberId} tag=${tag} body=${body}`);
      return;
    }
    console.log(`[tag-ok] sub=${subscriberId} tag=${tag}`);
  } catch (err) {
    console.error(`[tag-error] sub=${subscriberId} tag=${tag} err=${err.message}`);
    // Non-fatal — DM reply flow continues.
  }
}

// Detect funnel signals from the user's message. Returns an array of tags to
// apply (can be multiple). Order-independent keyword matching, case-insensitive.
function detectFunnelTags(message) {
  const tags = [];
  const m = (message || '').toLowerCase();
  if (!m) return tags;

  // Pricing signals (EN + ES)
  if (/\b(price|pricing|cost|how much|rate|rates|fee|fees|package|packages|precio|precios|cuanto cuesta|cuánto cuesta|cuesta|tarifa)\b/.test(m)) {
    tags.push('lead_pricing');
  }

  // Booking / scheduling signals
  if (/\b(book|booking|schedule|sign up|sign me up|appointment|session|consult|consultation|reservar|agendar|cita|reserva)\b/.test(m)) {
    tags.push('lead_booking_interest');
  }

  // Desk pain / posture signals
  if (/\b(desk|sitting|sit all day|posture|back pain|neck pain|stiff|stiffness|hunched|office chair|escritorio|sentad[oa]|postura|espalda|cuello|r[ií]gid)\b/.test(m)) {
    tags.push('lead_desk_pain');
  }

  // Quiz completion signals — usually triggered by a marker phrase or explicit
  // mention. The quiz itself lives at lauratreto.com/quiz and posts to
  // quiz-subscribe.js, not here. But if a DM references completing the quiz,
  // we tag it. (True quiz-complete tagging should also happen in quiz-subscribe.)
  if (/\b(took the quiz|finished the quiz|completed the quiz|my quiz result|quiz score|terminé el quiz|hice el quiz)\b/.test(m)) {
    tags.push('lead_quiz_complete');
  }

  // Fallback: general inquiry if none of the above fired and message is substantive
  if (tags.length === 0 && m.length >= 8) {
    tags.push('lead_general_inquiry');
  }

  return tags;
}

// ---------------------------------------------------------------------------
// System prompt — URLs are placeholders only. Real URLs injected post-generation.
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are Laura Treto responding to DMs on Instagram/Facebook. You are warm, curious, and brief.

About you:
- Movement coach in Key West, FL. Former elite dancer (Acosta Danza, 1,000+ international performances). Psychology degree. NASM certified.

Services (share ONLY when asked, and only the relevant one):
- Movement Assessment: $125, 60 min, in-person Key West
- 4-Session Pack: $460
- 8-Session Pack: $840
- Strong Lean Athletic: $149, 12-week online program

Links — you MUST include the placeholder tag when referring to any resource. The system replaces them with real URLs automatically. If you mention a resource without its tag, the user gets no link.
- Website: [LINK:website]
- Movement Quiz: [LINK:quiz]
- Free Seated Body Reset Guide (English): [LINK:guide_en]
- Free Seated Body Reset Guide (Spanish): [LINK:guide_es]

Example: "Here's the guide: [LINK:guide_en]" → becomes a clickable URL for the user.
Example: "You can book here: [LINK:website]" → becomes the real website link.
WRONG: "Head to my website" without [LINK:website] → user gets no link, dead end.

When to share which link:
- "MOVE" or sitting/posture/desk/stiffness topics → Guide (match their language)
- Curious about fitness, body, getting started → Quiz
- Ready to book, asks about pricing, or asks for a link → Website
- When someone says "yes", "send it", "sounds good" after you offered a resource → include the link immediately

CONVERSATION FLOW:
- First 1-2 messages: be curious, ask about their situation. No links yet.
- Once you understand their need (usually message 2-3): share the ONE most relevant link naturally.
- If they ask to book or say "send me the link": include the link right away, don't ask another question.
- If you just offered something and they say "yes", "sure", "send it", "yeah", "please", "ok": IMMEDIATELY send the link you offered. Do NOT ask what they meant. You know what you offered, send that link now.
- If someone describes desk/sitting/back pain: empathize AND offer the free guide with the link in the SAME message. Example: "That's so common with desk work! I made a free guide for exactly that: [LINK:guide_en]"

RULES (non-negotiable):
1. MAX 2 sentences per message. This is DM, not email. Be brief like texting.
2. Ask questions. Be curious about THEIR situation before giving answers. "What's going on with your body?" beats a paragraph about your services.
3. ONE topic per message. Never dump all services, all links, or all pricing at once.
4. If they ask about pricing, ask what they're looking for first. Then share only the relevant option.
5. NEVER re-send a link or info you already shared in this conversation. Read the conversation history. If you sent the quiz link, don't send it again.
6. NEVER use markdown formatting (no **bold**, no *italics*, no bullet lists). Plain text only. Instagram does not render markdown.
7. No em dashes. Use commas, periods, colons.
8. Match their language. Spanish gets Spanish. English gets English.
9. Max 1 emoji per message. Zero is fine.
10. Respond as Laura in first person.
11. Do NOT mention you are AI.
12. If someone says something vague like "tell me more" or "interesting", ask what specifically they want to know. Do not dump information.
13. Be like a friend who happens to be an expert, not a salesperson. Curious first, helpful second, selling never.
14. When you offer a resource and they say yes, ALWAYS include the placeholder tag in your next message. No dead ends.
15. NEVER mention that you cannot open links, files, audio, images, videos, or any technical limitation. NEVER apologize for not being able to process something. NEVER say things like "I can't open that", "I'm unable to view", "I appreciate you reaching out but...". If the message is unclear or references something you cannot see, respond warmly without acknowledging any limitation, or ask a curious question about their situation instead.`;

// ---------------------------------------------------------------------------
// Blob store initialization — v2 functions get NETLIFY_BLOBS_CONTEXT automatically
// ---------------------------------------------------------------------------
let blobStoreError = null;
let blobStoreMethod = null;

function initStore() {
  try {
    const store = getStore("conversations");
    blobStoreMethod = "v2:getStore('conversations')";
    return store;
  } catch (err) {
    console.error('Blob init failed:', err.message);
    blobStoreError = { message: err.message, stack: err.stack };
    return null;
  }
}

// ---------------------------------------------------------------------------
// Conversation history helpers
// ---------------------------------------------------------------------------

async function loadConversation(store, subscriberId) {
  if (!store) return null;
  try {
    const data = await store.get(subscriberId, { type: "json" });
    if (data && Array.isArray(data.messages)) {
      return data;
    }
    // New subscriber: initialize fresh conversation object
    return { messages: [], updatedAt: new Date().toISOString(), isNew: true };
  } catch (err) {
    console.error('Blob read error for subscriber', subscriberId, '|', err.message, '|', err.stack);
    blobStoreError = blobStoreError || {};
    blobStoreError.readError = { message: err.message, code: err.code, status: err.status };
    return null; // null signals storage failure — fall back to stateless
  }
}

async function saveConversation(store, subscriberId, conversation) {
  if (!store) return;
  try {
    conversation.updatedAt = new Date().toISOString();
    delete conversation.isNew; // remove initialization flag before saving
    // Trim to max history length
    if (conversation.messages.length > MAX_HISTORY_MESSAGES) {
      conversation.messages = conversation.messages.slice(-MAX_HISTORY_MESSAGES);
    }
    await store.setJSON(subscriberId, conversation);
    // Verification log: confirm write succeeded
    console.log('Blob write OK for subscriber', subscriberId, '| messages:', conversation.messages.length);
  } catch (err) {
    console.error('Blob write error for subscriber', subscriberId, '|', err.message, '|', err.stack);
    blobStoreError = blobStoreError || {};
    blobStoreError.writeError = { message: err.message, code: err.code, status: err.status };
    // Non-fatal — response was already sent to ManyChat
  }
}

// ---------------------------------------------------------------------------
// JSON response helper
// ---------------------------------------------------------------------------
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// ---------------------------------------------------------------------------
// Handler (Netlify Functions v2)
// ---------------------------------------------------------------------------

export default async (request, context) => {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  // Only accept POST
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method Not Allowed' }, 405);
  }

  // Health check: empty body
  let bodyText;
  try {
    bodyText = await request.text();
  } catch {
    bodyText = '';
  }

  if (!bodyText) {
    return jsonResponse({ status: 'ok', service: 'manychat-claude-webhook' });
  }

  // Kill switch — return empty response so ManyChat skips sending
  if (PAUSED) {
    return jsonResponse({ claude_response: "" });
  }

  try {
    const payload = JSON.parse(bodyText);

    // Handle ManyChat Full Contact Data (may be nested under 'contact' key)
    const data = payload.contact || payload;

    // ManyChat External Request sends subscriber fields.
    // Common field names for the user's last message:
    const userMessage =
      data.last_input_text ||
      data.last_text_input ||
      data.message ||
      '';

    const subscriberId = data.id || data.subscriber_id || 'unknown';
    const firstName = data.first_name || '';

    // Sanitize before any further processing
    const sanitizedMessage = sanitizeMessage(userMessage);

    // -----------------------------------------------------------------------
    // Non-text input guard — voice notes, images, files, stickers, CDN URLs.
    // Skip Claude entirely, flag for Laura, return empty claude_response so
    // ManyChat sends nothing. Silent handoff beats a robotic apology.
    // -----------------------------------------------------------------------
    if (isNonTextInput(sanitizedMessage)) {
      console.log(`[non-text-input] sub=${subscriberId} — skipping Claude, flagging for Laura. raw="${sanitizedMessage.slice(0, 100)}"`);
      // Flag for Laura via tag (fire and forget — never block)
      try {
        await tagSubscriber(subscriberId, 'needs_laura_review');
      } catch (err) {
        console.error(`[non-text-tag-fail] sub=${subscriberId} err=${err.message}`);
      }
      // TODO: email Laura via Resend (pending API key). For now, tag-only.
      // Return a no-op response to ManyChat — empty claude_response means ManyChat sends nothing.
      return jsonResponse({ claude_response: '' });
    }

    if (!sanitizedMessage) {
      return jsonResponse({ error: 'No message text found in payload' }, 400);
    }

    // Rate limit check
    if (isRateLimited(subscriberId)) {
      console.warn('Rate limit hit for subscriber:', subscriberId);
      return jsonResponse({
        claude_response: "I'm getting a lot of messages right now. Please try again in a moment."
      });
    }

    // -----------------------------------------------------------------------
    // Per-subscriber concurrent request lock — written IMMEDIATELY on arrival.
    // Prevents duplicate responses when ManyChat fires the webhook multiple
    // times for the same subscriber before the first response completes.
    // -----------------------------------------------------------------------
    const SUBSCRIBER_LOCK_TTL_MS = 30_000; // 30 seconds
    const subscriberLockKey = `lock:${subscriberId}`;

    try {
      const lockStore = getStore("dedup");
      const lock = await lockStore.get(subscriberLockKey, { type: "json" });
      if (lock && (Date.now() - lock.ts) < SUBSCRIBER_LOCK_TTL_MS) {
        console.log(`[sub-lock] sub=${subscriberId} — request blocked by per-subscriber lock (${Math.round((Date.now() - lock.ts)/1000)}s ago)`);
        return jsonResponse({ claude_response: "" }); // empty = ManyChat sends nothing
      }
      // Claim the lock immediately
      await lockStore.setJSON(subscriberLockKey, { ts: Date.now() });
      console.log(`[sub-lock] sub=${subscriberId} — lock acquired`);
    } catch (lockErr) {
      // Blob error — proceed without lock (better to reply than to drop)
      console.warn('[sub-lock-fail]', lockErr.message);
    }

    // -----------------------------------------------------------------------
    // Deduplication — prevents double replies when ManyChat retries a slow
    // request or fires the webhook twice for the same message.
    // Uses Blobs so it works across concurrent Lambda instances.
    // -----------------------------------------------------------------------
    const dedupHash = createHash('sha256')
      .update(`${subscriberId}:${sanitizedMessage}`)
      .digest('hex')
      .slice(0, 16);
    const DEDUP_TTL_MS = 120_000; // 120 seconds (was 30)

    try {
      const dedupStore = getStore("dedup");
      const existing   = await dedupStore.get(dedupHash, { type: "json" });
      if (existing && (Date.now() - existing.ts) < DEDUP_TTL_MS) {
        console.log(`[dedup] sub=${subscriberId} hash=${dedupHash} — duplicate suppressed`);
        return jsonResponse({ claude_response: "" });
      }
    } catch (dedupErr) {
      // Blob read failed — proceed without dedup (better to reply than to drop)
      console.warn('[dedup-read-fail]', dedupErr.message);
    }

    // -----------------------------------------------------------------------
    // Debug endpoint: message "__debug_memory__" returns storage diagnostics
    // -----------------------------------------------------------------------
    if (sanitizedMessage === '__debug_memory__') {
      const store = initStore();
      let debugInfo = {
        functionVersion: "v2-esm",
        storeInitialized: store !== null,
        storeMethod: blobStoreMethod,
        initError: blobStoreError,
        subscriberId: subscriberId,
        envVars: {
          hasSiteId: !!process.env.SITE_ID,
          siteIdValue: process.env.SITE_ID ? process.env.SITE_ID.slice(0, 8) + '...' : null,
          hasBlobsContext: !!process.env.NETLIFY_BLOBS_CONTEXT,
          blobsContextLength: process.env.NETLIFY_BLOBS_CONTEXT ? process.env.NETLIFY_BLOBS_CONTEXT.length : 0,
          hasAuthToken: !!process.env.NETLIFY_AUTH_TOKEN,
          hasDeployToken: !!process.env.DEPLOY_TOKEN,
          hasFunctionsToken: !!process.env.NETLIFY_FUNCTIONS_TOKEN,
          netlifyEnvKeys: Object.keys(process.env).filter(k =>
            k.includes('NETLIFY') || k.includes('SITE') || k.includes('BLOB') || k.includes('DEPLOY')
          )
        },
        conversation: null,
        readError: null
      };

      if (store) {
        try {
          const conv = await loadConversation(store, subscriberId);
          debugInfo.conversation = conv;
          debugInfo.readError = blobStoreError;
        } catch (err) {
          debugInfo.readError = { message: err.message, stack: err.stack };
        }
      }

      return jsonResponse({
        claude_response: 'DEBUG MODE: Check server response for diagnostics.',
        _debug: debugInfo
      });
    }

    // Build the user content for Claude
    const userContent = firstName
      ? `${firstName} says: ${sanitizedMessage}`
      : sanitizedMessage;

    // -----------------------------------------------------------------------
    // Load conversation history from Netlify Blobs
    // -----------------------------------------------------------------------
    const store = initStore();
    const conversation = await loadConversation(store, subscriberId);

    // If storage failed (null), fall back to stateless single-message mode
    const useHistory = conversation !== null;
    let messages;

    if (useHistory) {
      // Append the new user message to history
      conversation.messages.push({ role: "user", content: userContent });
      // Trim before sending to Claude
      if (conversation.messages.length > MAX_HISTORY_MESSAGES) {
        conversation.messages = conversation.messages.slice(-MAX_HISTORY_MESSAGES);
      }
      messages = conversation.messages;
    } else {
      // Stateless fallback
      messages = [{ role: "user", content: userContent }];
    }

    // Call Claude API (Haiku for speed + cost)
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 180,
        system: SYSTEM_PROMPT,
        messages: messages
      })
    });

    if (!claudeRes.ok) {
      const errBody = await claudeRes.text();
      console.error('Claude API error:', claudeRes.status, errBody);
      return jsonResponse({ error: 'Claude API request failed' }, 502);
    }

    const claudeData = await claudeRes.json();
    const rawReply = claudeData.content[0].text;

    // -----------------------------------------------------------------------
    // Post-processing pipeline: inject real URLs, then strip any markdown
    // -----------------------------------------------------------------------
    const replyText = stripMarkdown(injectUrls(rawReply));

    // -----------------------------------------------------------------------
    // Save updated conversation history (store the processed reply)
    // -----------------------------------------------------------------------
    if (useHistory) {
      conversation.messages.push({ role: "assistant", content: replyText });
      await saveConversation(store, subscriberId, conversation);
    }

    // -----------------------------------------------------------------------
    // Funnel tagging: apply ManyChat tags based on signal detection.
    // Wrapped in try/catch so a tag failure NEVER breaks the DM reply flow.
    // -----------------------------------------------------------------------
    try {
      const tagsToApply = detectFunnelTags(sanitizedMessage);
      if (tagsToApply.length > 0) {
        console.log(`[tag-detect] sub=${subscriberId} tags=${tagsToApply.join(',')}`);
        // Apply tags in parallel; individual failures are swallowed inside tagSubscriber.
        await Promise.all(tagsToApply.map(t => tagSubscriber(subscriberId, t)));
      }
    } catch (tagErr) {
      console.error('[tag-pipeline-error]', tagErr.message);
      // Swallow — reply still ships.
    }

    // Store reply in dedup cache (fire and forget — never block the response)
    try {
      const dedupStore = getStore("dedup");
      await dedupStore.setJSON(dedupHash, { ts: Date.now(), reply: replyText });
    } catch (dedupWriteErr) {
      console.warn('[dedup-write-fail]', dedupWriteErr.message);
    }

    // Release per-subscriber lock so they can message again after 15 seconds
    // (lock auto-expires via TTL, but also clear it explicitly for fast turnaround)
    try {
      const lockStore = getStore("dedup");
      await lockStore.delete(subscriberLockKey);
      console.log(`[sub-lock] sub=${subscriberId} — lock released`);
    } catch (lockReleaseErr) {
      console.warn('[sub-lock-release-fail]', lockReleaseErr.message);
    }

    // Return flat JSON for ManyChat Actions External Request.
    // ManyChat maps 'claude_response' to a custom field, then uses
    // that field in a subsequent Send Message step.
    return jsonResponse({ claude_response: replyText });

  } catch (error) {
    console.error('Webhook error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
};

export const config = {
  path: "/.netlify/functions/manychat-webhook"
};
