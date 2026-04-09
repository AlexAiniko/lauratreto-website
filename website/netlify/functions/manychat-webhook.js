// ManyChat-to-Claude Webhook for Laura Treto Coaching
// Netlify Function v2 (ES modules): receives DM via ManyChat External Request,
// generates a response via Claude, returns it for ManyChat to send.
//
// Deployed at: https://lauratreto.netlify.app/.netlify/functions/manychat-webhook
//
// Required env vars (set in Netlify UI):
//   ANTHROPIC_API_KEY - Anthropic API key
//   MANYCHAT_API_KEY  - ManyChat API token (for verification)

import { getStore } from "@netlify/blobs";

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

Links (use placeholders, system will inject real URLs):
- Website: [LINK:website]
- Movement Quiz: [LINK:quiz]
- Free Seated Body Reset Guide (English): [LINK:guide_en]
- Free Seated Body Reset Guide (Spanish): [LINK:guide_es]

When to share which link:
- "MOVE" or sitting/posture/desk/stiffness topics → Guide (match their language)
- Curious about fitness, body, getting started → Quiz
- Ready to book or asks about pricing → Website

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
13. Be like a friend who happens to be an expert, not a salesperson. Curious first, helpful second, selling never.`;

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
