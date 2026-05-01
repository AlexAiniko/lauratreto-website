# Netlify Functions: ManyChat-Claude Webhook

## What it does

`manychat-webhook.js` receives Instagram/Facebook DMs via ManyChat's External Request action, generates a personalized response using Claude (Haiku), and returns it for ManyChat to send back to the user.

The response feels human because ManyChat's built-in Smart Delay adds a 1-2 minute pause before sending.

## Webhook URL

```
https://lauratreto.netlify.app/.netlify/functions/manychat-webhook
```

## Environment Variables (set in Netlify UI)

Go to **Netlify > Site settings > Environment variables** and add:

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `MANYCHAT_API_KEY` | ManyChat API token (for future auth, not yet enforced) |

## ManyChat Flow Setup

1. **Create a new Flow** triggered by any incoming DM (or a specific keyword)
2. **Add "External Request" action:**
   - Method: POST
   - URL: `https://lauratreto.netlify.app/.netlify/functions/manychat-webhook`
   - Request Body (JSON): Map these ManyChat system fields:
     ```json
     {
       "last_input_text": "{{last input text}}",
       "subscriber_id": "{{id}}",
       "first_name": "{{first name}}"
     }
     ```
   - Response Mapping: Map the response field `claude_response` to a ManyChat custom field called `claude_response` (create this Text custom field first)
3. **Add "Smart Delay" step:** Set to random 1-2 minutes
4. **Add "Send Message" step:** Use the dynamic field `{{claude_response}}` as the message text

## How it works

```
User sends DM
    -> ManyChat receives it
    -> ManyChat External Request hits our webhook
    -> Webhook calls Claude Haiku with Laura's business context
    -> Webhook returns { claude_response: "..." }
    -> ManyChat saves it to custom field
    -> ManyChat waits 1-2 minutes (Smart Delay)
    -> ManyChat sends the response as a DM
```

## Cost

Claude Haiku: roughly $0.001-0.003 per DM response. At 100 DMs/day that is about $0.10-0.30/day.

## Model

Uses `claude-haiku-4-5-20251001` for speed (sub-second) and low cost. Can be upgraded to Sonnet if response quality needs improvement.

<!-- preview-trigger: stripe-e2e-test 2026-04-30 -->

