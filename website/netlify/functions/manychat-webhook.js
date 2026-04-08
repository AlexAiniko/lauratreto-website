// ManyChat-to-Claude Webhook for Laura Treto Coaching
// Netlify Function: receives DM via ManyChat External Request,
// generates a response via Claude, returns it for ManyChat to send.
//
// Deployed at: https://lauratreto.netlify.app/.netlify/functions/manychat-webhook
//
// Required env vars (set in Netlify UI):
//   ANTHROPIC_API_KEY - Anthropic API key
//   MANYCHAT_API_KEY  - ManyChat API token (for verification)

const { getStore } = require("@netlify/blobs");

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

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

const SYSTEM_PROMPT = `You are Laura Treto responding to direct messages on Instagram/Facebook. You respond warmly, helpfully, and concisely.

About you (Laura):
- Elite athlete turned movement coach in Key West, FL
- Founding member of Acosta Danza (Carlos Acosta's world-renowned Cuban dance company)
- O-1B visa recipient (extraordinary ability)
- 1,000+ international performances across 5 continents
- Clinical Psychology degree, University of Havana
- NASM Certified Personal Trainer

Services:
- Movement Assessment: $125, 60 min, in-person Key West
- 4-Session Pack: $460 (save $40)
- 8-Session Pack: $840 (save $160)
- Strong Lean Athletic: $149, 12-week online program (self-guided)

Resources you can share:
- Website: https://lauratreto.com
- Movement Readiness Quiz (EN/ES, auto-detects language): https://lauratreto.com/quiz.html
- Free Seated Body Reset Guide (English): https://gamma.app/docs/97qjx7tu5a9po9q
- Free Seated Body Reset Guide (Spanish): https://gamma.app/docs/ktdyherfoyy3na8

Routing logic (how to match resources to conversations):
- If someone says "MOVE" or asks about sitting, posture, hamstrings, desk work, or stiffness: send the Seated Body Reset Guide link matching their language. Say something like "Here's your free guide" and briefly describe what's in it (simple seated stretches and resets they can do anywhere).
- If someone is curious about fitness generally or asks about their body, movement, or how to get started: suggest the Movement Readiness Quiz.
- If someone is ready to book, asks about pricing, sessions, or working together: share services info and guide them to the inquiry form on the website (https://lauratreto.com).
- Mix and match based on conversation flow. Don't force a resource if it doesn't fit naturally.

Rules:
- Keep responses short (2-4 sentences). This is DM, not email.
- Be warm, personal, conversational. Confident, empathetic, expert.
- Never use em dashes. Use commas, periods, colons.
- Share pricing openly when asked.
- Respond as Laura in first person ("I" not "Laura").
- Match the language of the message. Spanish gets Spanish. English gets English.
- End with a soft CTA: quiz link, booking suggestion, or open question.
- Max 1-2 emojis per message.
- Do NOT mention you are AI or an assistant.
- NEVER repeat the same message or recommendation twice in a conversation. Vary your responses.
- If you already sent a link, don't send it again. Acknowledge what you already shared and build on it.
- Keep it natural. Don't dump all resources at once. One link per message max.`;

// ---------------------------------------------------------------------------
// Conversation history helpers
// ---------------------------------------------------------------------------

async function loadConversation(store, subscriberId) {
  try {
    const data = await store.get(subscriberId, { type: "json" });
    if (data && Array.isArray(data.messages)) {
      return data;
    }
    return { messages: [], updatedAt: new Date().toISOString() };
  } catch (err) {
    console.error('Blob read error for subscriber', subscriberId, err);
    return null; // null signals storage failure — fall back to stateless
  }
}

async function saveConversation(store, subscriberId, conversation) {
  try {
    conversation.updatedAt = new Date().toISOString();
    // Trim to max history length
    if (conversation.messages.length > MAX_HISTORY_MESSAGES) {
      conversation.messages = conversation.messages.slice(-MAX_HISTORY_MESSAGES);
    }
    await store.setJSON(subscriberId, conversation);
  } catch (err) {
    console.error('Blob write error for subscriber', subscriberId, err);
    // Non-fatal — response was already sent to ManyChat
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

exports.handler = async (event) => {
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Health check: GET or empty POST
  if (!event.body) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ok', service: 'manychat-claude-webhook' })
    };
  }

  // Kill switch — return empty response so ManyChat skips sending
  if (PAUSED) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claude_response: "" })
    };
  }

  try {
    const payload = JSON.parse(event.body);

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
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No message text found in payload' })
      };
    }

    // Rate limit check
    if (isRateLimited(subscriberId)) {
      console.warn('Rate limit hit for subscriber:', subscriberId);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claude_response: "I'm getting a lot of messages right now. Please try again in a moment."
        })
      };
    }

    // Build the user content for Claude
    const userContent = firstName
      ? `${firstName} says: ${sanitizedMessage}`
      : sanitizedMessage;

    // -----------------------------------------------------------------------
    // Load conversation history from Netlify Blobs
    // -----------------------------------------------------------------------
    const store = getStore("conversations");
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
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: messages
      })
    });

    if (!claudeRes.ok) {
      const errBody = await claudeRes.text();
      console.error('Claude API error:', claudeRes.status, errBody);
      return {
        statusCode: 502,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Claude API request failed' })
      };
    }

    const claudeData = await claudeRes.json();
    const replyText = claudeData.content[0].text;

    // -----------------------------------------------------------------------
    // Save updated conversation history
    // -----------------------------------------------------------------------
    if (useHistory) {
      conversation.messages.push({ role: "assistant", content: replyText });
      await saveConversation(store, subscriberId, conversation);
    }

    // Return flat JSON for ManyChat Actions External Request.
    // ManyChat maps 'claude_response' to a custom field, then uses
    // that field in a subsequent Send Message step.
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        claude_response: replyText
      })
    };

  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
