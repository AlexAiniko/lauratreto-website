// ManyChat-to-Claude Webhook for Laura Treto Coaching
// Netlify Function: receives DM via ManyChat External Request,
// generates a response via Claude, returns it for ManyChat to send.
//
// Deployed at: https://lauratreto.netlify.app/.netlify/functions/manychat-webhook
//
// Required env vars (set in Netlify UI):
//   ANTHROPIC_API_KEY - Anthropic API key
//   MANYCHAT_API_KEY  - ManyChat API token (for verification)

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

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
- Free Movement Readiness Quiz: https://lauratreto.com/quiz.html

Rules:
- Keep responses short (2-4 sentences). This is DM, not email.
- Be warm, personal, conversational. Confident, empathetic, expert.
- Never use em dashes. Use commas, periods, colons.
- Share pricing openly when asked.
- Respond as Laura in first person ("I" not "Laura").
- Match the language of the message. Spanish gets Spanish. English gets English.
- End with a soft CTA: quiz link, booking suggestion, or open question.
- Max 1-2 emojis per message.
- Do NOT mention you are AI or an assistant.`;

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

    const subscriberId = data.id || data.subscriber_id || null;
    const firstName = data.first_name || '';

    if (!userMessage) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No message text found in payload' })
      };
    }

    // Build the user content for Claude
    const userContent = firstName
      ? `${firstName} says: ${userMessage}`
      : userMessage;

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
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userContent }
        ]
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

    // Return the response for ManyChat to map to a custom field.
    // ManyChat External Request maps JSON keys to custom fields.
    // Flow: External Request -> save `claude_response` to custom field ->
    //       Smart Delay (1-2 min) -> Send message using {{claude_response}}
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
