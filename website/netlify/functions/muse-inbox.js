// Muse Inbox API — Laura Treto Coaching
// Netlify Function v2 (ES modules): lists unprocessed messages from the
// muse-inbox blob store for content strategy retrieval.
//
// Deployed at: https://lauratreto.netlify.app/.netlify/functions/muse-inbox
//
// Required env vars (set in Netlify UI):
//   MUSE_INBOX_TOKEN - Bearer token for authentication (required)
//
// Usage:
//   GET /.netlify/functions/muse-inbox
//     → Returns all unprocessed messages as JSON array
//   GET /.netlify/functions/muse-inbox?mark_processed=true
//     → Returns unprocessed messages AND marks them as processed
//   GET /.netlify/functions/muse-inbox?all=true
//     → Returns ALL messages (including processed)

import { getStore } from "@netlify/blobs";

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (request, context) => {
  // Only accept GET
  if (request.method !== "GET") {
    return jsonResponse({ error: "Method Not Allowed" }, 405);
  }

  // Auth check
  const expectedToken = process.env.MUSE_INBOX_TOKEN;
  if (!expectedToken) {
    console.error("MUSE_INBOX_TOKEN not set");
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const authHeader = request.headers.get("authorization") || "";
  const providedToken = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (providedToken !== expectedToken) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const store = getStore("muse-inbox");
    const url = new URL(request.url);
    const markProcessed = url.searchParams.get("mark_processed") === "true";
    const showAll = url.searchParams.get("all") === "true";

    // List all blobs in the store
    const { blobs } = await store.list();

    if (!blobs || blobs.length === 0) {
      return jsonResponse([]);
    }

    // Fetch all message data
    const messages = [];
    for (const blob of blobs) {
      try {
        const data = await store.get(blob.key, { type: "json" });
        if (data) {
          data._key = blob.key;
          messages.push(data);
        }
      } catch (err) {
        console.error("Failed to read blob:", blob.key, err.message);
      }
    }

    // Filter to unprocessed only (unless ?all=true)
    const filtered = showAll
      ? messages
      : messages.filter((m) => !m.processed);

    // Sort by timestamp ascending
    filtered.sort((a, b) => {
      const tA = a.timestamp || "";
      const tB = b.timestamp || "";
      return tA < tB ? -1 : tA > tB ? 1 : 0;
    });

    // Mark as processed if requested
    if (markProcessed && !showAll) {
      for (const msg of filtered) {
        try {
          msg.processed = true;
          const key = msg._key;
          delete msg._key;
          await store.setJSON(key, msg);
        } catch (err) {
          console.error("Failed to mark processed:", msg._key, err.message);
        }
      }
    } else {
      // Clean up internal key before returning
      for (const msg of filtered) {
        delete msg._key;
      }
    }

    return jsonResponse(filtered);
  } catch (err) {
    console.error("Muse inbox error:", err.message, err.stack);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
};

export const config = {
  path: "/.netlify/functions/muse-inbox",
};
