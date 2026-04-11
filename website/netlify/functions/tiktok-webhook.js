// TikTok Webhook Handler
// Netlify Function v2 (ES modules)
//
// Deployed at: https://lauratreto.com/tiktok-webhook
//
// Handles:
//   GET  — TikTok challenge verification (returns challenge value)
//   POST — TikTok event payloads (video.published, comment.posted, etc.)
//
// For comment events with buying signals, Claude Haiku generates a reply
// and logs it. Comment auto-posting requires comment.create scope (production).

import Anthropic from "@anthropic-ai/sdk";
import { getStore } from "@netlify/blobs";

// ---------------------------------------------------------------------------
// Laura's brand context for Claude
// ---------------------------------------------------------------------------

const LAURA_SYSTEM = `You are helping Laura Treto, a movement and longevity coach based in Key West, FL.
Laura was a founding member of Acosta Danza, has a Clinical Psychology degree, and coaches adults 40+ on strength, mobility, and confidence.
Her booking link is https://lauratreto.com
Her assessment is $125 for 60 minutes.

Your job: analyze a TikTok comment and decide if it's a buying signal.
Buying signals include: asking about price, how to book, how to start, what the program is, where to sign up, how to work with Laura, asking for more info.

Reply with valid JSON only:
{
  "is_buying_signal": true/false,
  "reply": "warm 1-2 sentence reply in Laura's voice ending with a CTA, or null if not a buying signal"
}

Reply rules if buying signal:
- Warm, direct, never salesy
- Never use em dashes
- End with: "Book at lauratreto.com" or "Visit lauratreto.com to get started"
- Max 150 characters total`;

// ---------------------------------------------------------------------------
// Buying signal detector
// ---------------------------------------------------------------------------

async function analyzeComment(commentText) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("tiktok-webhook: ANTHROPIC_API_KEY not set, skipping AI analysis");
    return null;
  }

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: LAURA_SYSTEM,
      messages: [{ role: "user", content: `Comment: "${commentText}"` }],
    });

    const raw = msg.content[0]?.text?.trim() ?? "";
    // Strip markdown fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("tiktok-webhook: Claude analysis failed:", err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Store event log in Netlify Blobs
// ---------------------------------------------------------------------------

async function logEvent(eventType, data) {
  try {
    const store = getStore("tiktok-events");
    const key   = `${eventType}-${Date.now()}`;
    await store.setJSON(key, { event_type: eventType, received_at: new Date().toISOString(), ...data });
  } catch (err) {
    console.error("tiktok-webhook: blob log failed:", err.message);
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

export default async (request) => {
  // --- GET: TikTok challenge verification ---
  if (request.method === "GET") {
    const url       = new URL(request.url);
    const challenge = url.searchParams.get("challenge");
    if (challenge) {
      console.log("tiktok-webhook: challenge verified");
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return new Response("TikTok Webhook — OK", { status: 200 });
  }

  // --- POST: incoming event ---
  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    const eventType = body?.event ?? body?.event_type ?? "unknown";
    console.log(`tiktok-webhook: received event [${eventType}]`, JSON.stringify(body).slice(0, 200));

    // --- Comment event ---
    if (eventType === "comment.posted" || eventType === "comment.created") {
      const comment   = body?.data?.comment_text ?? body?.data?.text ?? "";
      const commentId = body?.data?.comment_id ?? body?.data?.id ?? "";
      const videoId   = body?.data?.video_id ?? "";
      const username  = body?.data?.username ?? "unknown";

      console.log(`tiktok-webhook: comment from @${username}: "${comment}"`);

      if (comment) {
        const analysis = await analyzeComment(comment);
        if (analysis?.is_buying_signal && analysis?.reply) {
          console.log(`tiktok-webhook: BUYING SIGNAL detected. Suggested reply: "${analysis.reply}"`);
          // Log for manual review / future auto-reply when comment.create scope is available
          await logEvent("buying_signal_comment", {
            video_id:   videoId,
            comment_id: commentId,
            username,
            comment,
            suggested_reply: analysis.reply,
          });
        } else {
          console.log("tiktok-webhook: not a buying signal, no reply needed");
        }
      }
    }

    // --- Video published event ---
    if (eventType === "video.published" || eventType === "post.published") {
      const videoId = body?.data?.video_id ?? body?.data?.id ?? "";
      console.log(`tiktok-webhook: video published, id=${videoId}`);
      await logEvent("video_published", { video_id: videoId });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
};
