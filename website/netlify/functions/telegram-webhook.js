// Telegram Bot Webhook for Muse Inbox — Laura Treto Coaching
// Netlify Function v2 (ES modules): receives messages from Telegram,
// stores them in Netlify Blobs for later retrieval by the Muse content agent.
//
// Deployed at: https://lauratreto.netlify.app/.netlify/functions/telegram-webhook
//
// Required env vars (set in Netlify UI):
//   TELEGRAM_BOT_TOKEN          - Telegram Bot API token (required)
//   TELEGRAM_ALLOWED_CHAT_IDS   - Comma-separated whitelist of chat IDs (optional; if unset, accepts all)

import { getStore } from "@netlify/blobs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function ok() {
  // Always return 200 to Telegram to prevent retries
  return jsonResponse({ ok: true });
}

async function sendTelegramReply(botToken, chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (err) {
    console.error("Telegram sendMessage failed:", err.message);
  }
}

// ---------------------------------------------------------------------------
// Message extraction
// ---------------------------------------------------------------------------

function extractMessageData(message) {
  const result = {
    id: message.message_id,
    timestamp: message.date
      ? new Date(message.date * 1000).toISOString()
      : new Date().toISOString(),
    chat_id: message.chat?.id,
    from_name: [message.from?.first_name, message.from?.last_name]
      .filter(Boolean)
      .join(" ") || "Unknown",
    type: "text",
    content: "",
    urls: [],
    caption: null,
    raw_entities: null,
    processed: false,
  };

  // Forwarded message
  if (message.forward_from || message.forward_from_chat || message.forward_origin) {
    result.type = "forward";
    result.forward_info = {
      from: message.forward_from_chat?.title ||
            message.forward_from?.first_name ||
            message.forward_origin?.sender_user?.first_name ||
            "unknown",
    };
  }

  // Photo
  if (message.photo && message.photo.length > 0) {
    result.type = result.type === "forward" ? "forward" : "photo";
    // Largest photo is last in the array
    const largest = message.photo[message.photo.length - 1];
    result.content = `[photo: ${largest.file_id}]`;
    result.caption = message.caption || null;
    result.raw_entities = message.caption_entities || null;
    // Extract URLs from caption entities
    if (message.caption_entities) {
      result.urls = extractUrls(message.caption, message.caption_entities);
    }
  }
  // Video
  else if (message.video) {
    result.type = result.type === "forward" ? "forward" : "video";
    result.content = `[video: ${message.video.file_id}]`;
    result.caption = message.caption || null;
    result.raw_entities = message.caption_entities || null;
    if (message.caption_entities) {
      result.urls = extractUrls(message.caption, message.caption_entities);
    }
  }
  // Document
  else if (message.document) {
    result.type = result.type === "forward" ? "forward" : "document";
    result.content = `[document: ${message.document.file_name || message.document.file_id}]`;
    result.caption = message.caption || null;
  }
  // Animation / GIF
  else if (message.animation) {
    result.type = result.type === "forward" ? "forward" : "animation";
    result.content = `[animation: ${message.animation.file_id}]`;
    result.caption = message.caption || null;
  }
  // Text
  else if (message.text) {
    result.content = message.text;
    result.raw_entities = message.entities || null;
    // Extract URLs from text entities
    if (message.entities) {
      result.urls = extractUrls(message.text, message.entities);
    }
    // If the message contains URLs, mark as link type (unless forwarded)
    if (result.urls.length > 0 && result.type !== "forward") {
      result.type = "link";
    }
  }

  return result;
}

function extractUrls(text, entities) {
  if (!text || !entities) return [];
  const urls = [];
  for (const entity of entities) {
    if (entity.type === "url") {
      urls.push(text.substring(entity.offset, entity.offset + entity.length));
    } else if (entity.type === "text_link" && entity.url) {
      urls.push(entity.url);
    }
  }
  return urls;
}

// ---------------------------------------------------------------------------
// Handler (Netlify Functions v2)
// ---------------------------------------------------------------------------

export default async (request, context) => {
  // Only accept POST
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, 405);
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("TELEGRAM_BOT_TOKEN not set");
    return ok();
  }

  let body;
  try {
    const text = await request.text();
    if (!text) return ok();
    body = JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse request body:", err.message);
    return ok();
  }

  try {
    // Telegram sends updates; we care about messages
    const message = body.message || body.channel_post;
    if (!message) {
      console.log("Update has no message field, skipping. Type:", Object.keys(body).join(", "));
      return ok();
    }

    const chatId = message.chat?.id;

    // Chat ID whitelist check
    const allowedRaw = process.env.TELEGRAM_ALLOWED_CHAT_IDS;
    if (allowedRaw) {
      const allowed = allowedRaw.split(",").map((id) => id.trim());
      if (!allowed.includes(String(chatId))) {
        console.warn("Rejected message from unauthorized chat_id:", chatId);
        await sendTelegramReply(botToken, chatId, "Not authorized.");
        return ok();
      }
    } else {
      // No whitelist set — log chat_id for initial setup discovery
      console.log("No TELEGRAM_ALLOWED_CHAT_IDS set. Message from chat_id:", chatId);
    }

    // Check that message has actual content
    const hasContent =
      message.text ||
      message.photo ||
      message.video ||
      message.document ||
      message.animation ||
      message.caption ||
      message.forward_from ||
      message.forward_from_chat ||
      message.forward_origin;

    if (!hasContent) {
      console.log("Message has no extractable content, skipping");
      return ok();
    }

    // Extract structured data
    const data = extractMessageData(message);

    // Store in Netlify Blobs
    const store = getStore("muse-inbox");
    const ts = Date.now();
    const key = `msg-${ts}-${message.message_id}`;

    await store.setJSON(key, data);
    console.log("Stored muse-inbox item:", key, "| type:", data.type);

    // Send confirmation reply
    const typeLabel = data.type === "text" ? "" : ` [${data.type}]`;
    await sendTelegramReply(botToken, chatId, `Saved for Muse ✓${typeLabel}`);

    return ok();
  } catch (err) {
    console.error("Telegram webhook error:", err.message, err.stack);
    // Always 200 to prevent Telegram retries
    return ok();
  }
};

export const config = {
  path: "/.netlify/functions/telegram-webhook",
};
