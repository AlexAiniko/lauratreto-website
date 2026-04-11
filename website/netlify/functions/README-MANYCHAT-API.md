# ManyChat API — Subscriber Tagging Setup

The webhook (`manychat-webhook.js`) now auto-tags Instagram subscribers by funnel stage so Laura can segment leads in ManyChat.

## What it does

Every time a DM hits the webhook, after Claude generates the reply, the function scans the user's message for funnel signals and calls the ManyChat API to apply one or more tags to the subscriber:

| Tag | Trigger |
|---|---|
| `lead_pricing` | User asks about cost, price, rates, packages, "how much", "precio", "cuánto cuesta" |
| `lead_booking_interest` | User asks to book, schedule, sign up, "appointment", "reservar", "agendar" |
| `lead_desk_pain` | User mentions desk, sitting, posture, back/neck pain, stiffness, "escritorio", "espalda" |
| `lead_quiz_complete` | User mentions finishing the movement quiz ("took the quiz", "hice el quiz") |
| `lead_general_inquiry` | Catch-all for any other substantive message (no strong signal) |

Tags fire via `POST https://api.manychat.com/fb/subscriber/addTagByName`. Multiple tags can apply to one message.

## Safety: failures never break the DM flow

Tagging is wrapped in `try/catch` inside `tagSubscriber()` AND in the calling block. If the ManyChat API is down, returns an error, or the env var is missing, the webhook logs the failure and continues — Laura's subscribers still get their DM reply. Zero risk to the existing flow.

## What Alex needs to do

### 1. Get the ManyChat API token

1. Log into ManyChat
2. Go to **Settings → API**
3. Copy the API token (starts with a long alphanumeric string)

### 2. Add it to Netlify

1. Netlify dashboard → select the `lauratreto` site
2. **Site settings → Environment variables → Add a variable**
3. Key: `MANYCHAT_API_KEY`
4. Value: (paste the token)
5. Scope: All deploy contexts
6. Save

### 3. Create the tags in ManyChat (optional but recommended)

ManyChat's `addTagByName` endpoint will auto-create tags that don't exist, but it's cleaner to pre-create them so Laura sees them in her dashboard immediately:

1. ManyChat → **Audience → Tags**
2. Create each of the 5 tags listed in the table above

### 4. Deploy

Commit + push the webhook changes. Netlify auto-deploys. No code changes needed beyond what's already in `manychat-webhook.js`.

## Testing

After deploy, send a test DM to @coachlauratreto with a pricing question like "how much are your sessions?" Then check:

- Netlify function logs → look for `[tag-detect] sub=... tags=lead_pricing` and `[tag-ok] sub=... tag=lead_pricing`
- ManyChat → Audience → find that test subscriber → confirm `lead_pricing` tag is applied

If the env var is missing, logs will show `[tag-skip] MANYCHAT_API_KEY not set` — add the token in Netlify and redeploy.

## Signal tuning

The keyword lists live in the `detectFunnelTags()` function in `manychat-webhook.js`. Both English and Spanish patterns are included. Edit that function to add/remove keywords or introduce new tags.
