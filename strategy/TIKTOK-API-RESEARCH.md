# TikTok API Access: Social Feed Integration Research
*Generated: April 5, 2026 | Sources: 15+ | Confidence: High*
*Account: @coachlauratreto | 13.9K followers | 334 videos*

---

## Executive Summary

TikTok has a working API for displaying a user's videos on a website (called the **Display API**). It requires creating a developer account, building a "app" in their portal, and going through an app review that takes **3 days to 2 weeks**. The user (Laura) must **log in and authorize** the app with OAuth, which makes it less plug-and-play than Meta's setup.

**The fastest path:** Use the **oEmbed API** (no account, no approval, no code) to embed individual videos, or use a third-party aggregator like **Curator.io** to auto-pull Laura's feed without touching TikTok's official API at all. For a fully native integration matching Meta's current setup, the Display API is the right tool but requires upfront approval work.

**Recommendation: Start with Curator.io (free tier) immediately. Pursue the Display API in parallel. Live in 15 minutes vs. 2 weeks.**

---

## 1. The TikTok Display API (Official Route)

### What It Does
The Display API lets your website pull a TikTok creator's public profile and videos and display them natively. It is the TikTok equivalent of Meta's Graph API for Instagram feed display.

**Three endpoints:**
| Endpoint | What It Returns |
|----------|----------------|
| `GET /v2/user/info/` | open_id, avatar_url, display_name, bio, profile_deep_link |
| `GET /v2/video/list/` | Metadata for user's recently uploaded videos |
| `GET /v2/video/query/` | Metadata for specific videos by video ID |

**Base URL:** `https://open.tiktokapis.com`

**Required Scopes (permissions):**
- `user.info.basic` - read profile info (avatar, display name)
- `video.list` - read the user's public video list

**Rate Limits:**
- `/v2/user/info/`: 600 requests/minute
- `/v2/video/list/`: 600 requests/minute
- `/v2/video/query/`: 600 requests/minute
- Calculated on a 1-minute sliding window. HTTP 429 returned if exceeded.
- For a website social feed refreshed every few minutes, this limit will never be hit.

### Important Architectural Note
The Display API uses **OAuth 2.0**, meaning Laura must personally log in to TikTok through your app and authorize it. The access token expires in 86,400 seconds (24 hours) with a refresh token valid for 1 year. This means you need either a scheduled token refresh or a one-time setup where Laura authenticates, and the system stores/refreshes the token automatically.

---

## 2. App Registration: Exact Step-by-Step

**Start here:** https://developers.tiktok.com/login/

### Step 1: Create Developer Account
1. Go to https://developers.tiktok.com
2. Click **Log in** top right
3. Sign in with a TikTok account (use Laura's @coachlauratreto account OR create a separate developer account with email)
4. Accept Developer Terms and Conditions
5. Verify email with PIN code (valid 1 minute -- check inbox immediately)

### Step 2: Create the App
1. Click profile icon (top right) > **Manage apps**
2. Click **Connect an app**
3. Select or create an **Organization** (can use Laura Treto Coaching as org name)
4. Fill in **Basic Information:**
   - App icon: 1024x1024px JPEG or PNG, max 5MB
   - App name: e.g., "Laura Treto Website"
   - App description: "Display Laura Treto's TikTok videos on her coaching website lauratreto.com"
   - Category: "Entertainment" or "Lifestyle"
   - Terms of Service URL: https://lauratreto.com (or /privacy)
   - Privacy Policy URL: https://lauratreto.com/privacy
5. **Platform:** Select **Web** > enter `https://lauratreto.com`

### Step 3: Add the Right Products
1. Click **Add products**
2. Add **Login Kit** (required for OAuth - getting the access token)
3. Add **Display API** (the actual video fetching)
4. Under Login Kit settings, add **Redirect URI:** `https://lauratreto.netlify.app/tiktok-callback` (Max will set this up)

### Step 4: Configure Scopes
Under Display API settings, ensure these scopes are enabled:
- `user.info.basic`
- `video.list`

### Step 5: Submit for App Review
1. Go to the **App review** section within the app settings
2. Fill in:
   - Detailed description of how you'll use the API: "Display @coachlauratreto's TikTok videos in a social feed grid on lauratreto.com to showcase content for prospective coaching clients"
   - Record a **demo video** (required, up to 50MB): a screen recording showing the mock-up or the website where the feed will appear
3. Click **Submit for review**
4. Status changes to **In Review** -- no further changes possible during review

### Step 6: Wait for Approval
- Standard timeline: **3 days to 2 weeks**
- You will get email notification
- If rejected, read "Review comments" in History tab, fix issues, resubmit
- During review: you have **sandbox access** for testing (sandbox only returns fake/test data)

### Step 7: After Approval -- OAuth Authorization
Once live, Laura needs to complete a one-time OAuth login:
1. Your app redirects Laura to TikTok's authorization URL with scopes `user.info.basic,video.list`
2. Laura logs in with @coachlauratreto and clicks "Authorize"
3. TikTok redirects back to your site with an authorization code
4. Your server exchanges the code for an `access_token` (valid 24hrs) + `refresh_token` (valid 1 year)
5. Store both tokens -- Kai sets up auto-refresh

**First API call (example):**
```
GET https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name
Authorization: Bearer [ACCESS_TOKEN]
```

---

## 3. App Review Requirements (Detail)

| Requirement | Detail |
|-------------|--------|
| Demo video | Required. At least 1, max 5. Up to 50MB each. Screen recording works. |
| Website URL | Must be live and accessible. lauratreto.com must be up. |
| Description | Must clearly explain data usage and display purpose |
| Review time | 3 days minimum, up to 2 weeks |
| During review | Sandbox available, production blocked |
| If rejected | Fix, resubmit. No limit on resubmissions. |
| Geography | Must be in an approved country. US is fine. |

**Key risk:** If lauratreto.com is not yet live or the privacy policy page is missing, the app can be rejected. Website should be live before submitting.

---

## 4. Alternatives (Faster Paths)

### Option A: TikTok oEmbed API (Free, Zero Approval, Works Today)
**Endpoint:** `https://www.tiktok.com/oembed?url=[VIDEO_URL]`

**Example:**
```
https://www.tiktok.com/oembed?url=https://www.tiktok.com/@coachlauratreto/video/[VIDEO_ID]
```

Returns: title, author name, thumbnail, embed HTML (blockquote + script), width/height.

**Limitations:**
- Works for **individual videos only** -- no way to auto-pull a feed
- No account or approval needed
- URLs must be known in advance (you'd have to manually add each video)
- Good for featuring 1-3 specific videos (e.g., a hero testimonial video)

**Verdict:** Use for pinning specific highlight videos on the website. Not suitable for auto-updating feed.

---

### Option B: Curator.io (Recommended Immediate Solution)
**URL:** https://curator.io

**What it does:** Third-party aggregator that connects to TikTok and auto-pulls your feed. Gives you a styled embed code to paste into the website.

**Process (15 minutes, no code review):**
1. Go to curator.io, create free account
2. Connect @coachlauratreto TikTok account (OAuth login)
3. Choose feed layout: grid, waterfall, or carousel
4. Style to match brand colors (coral, turquoise)
5. Get embed snippet -- Max pastes it into the website
6. Done. Feed auto-updates when Laura posts.

**Pricing:**
- Free plan: available, limited styling
- Paid plans: more styling, higher post volume

**Verdict: Best immediate path. Live today. No approval wait.**

---

### Option C: EmbedSocial, Elfsight, or SociableKit (Paid Alternatives)
Similar to Curator.io. Paid-only, more polish, more customization. Monthly fee ($10-$49/mo depending on plan). Worth considering if Curator's free tier is too limited.

---

## 5. Comparison: Official API vs. Alternatives

| Factor | Display API (Official) | Curator.io | oEmbed |
|--------|----------------------|------------|--------|
| Approval needed | Yes, 1-2 weeks | No | No |
| Auto-updating feed | Yes | Yes | No (manual) |
| Styling control | Full (Max codes it) | Medium | Minimal |
| Cost | Free | Free/paid | Free |
| Token maintenance | Yes (annual refresh) | No | No |
| Time to live | 2+ weeks | Today | Today |
| Long-term reliability | Highest | Dependent on 3rd party | Stable |

---

## 6. What Alex Needs to Do RIGHT NOW

**Immediate action (today):**

1. Go to https://curator.io -- create account, connect @coachlauratreto, get embed code. Hand embed code to Max to drop into the website. Feed is live today.

**Parallel track (this week):**

2. Go to https://developers.tiktok.com/login/ -- log in with Laura's TikTok account OR create a developer account with alex@alexmene.com
3. Create the app as described in Section 2 above
4. Make sure lauratreto.com is live and has a Privacy Policy page before submitting for review
5. Record a 30-second screen recording of the website showing where the TikTok feed will appear (can use a placeholder/mockup)
6. Submit for review
7. While in review: Curator.io handles the live feed
8. After approval (week 2-3): Kai builds the native Display API integration, swaps out Curator.io, no dependency on third party

---

## 7. Key URLs

| Resource | URL |
|----------|-----|
| TikTok Developer Portal | https://developers.tiktok.com |
| Login / Register | https://developers.tiktok.com/login/ |
| App Management | https://developers.tiktok.com/apps/ |
| Display API Overview | https://developers.tiktok.com/doc/display-api-overview |
| Display API Get Started | https://developers.tiktok.com/doc/display-api-get-started |
| App Review Guidelines | https://developers.tiktok.com/doc/app-review-guidelines |
| App Review FAQ | https://developers.tiktok.com/doc/getting-started-faq |
| Rate Limits | https://developers.tiktok.com/doc/tiktok-api-v2-rate-limit |
| oEmbed Docs | https://developers.tiktok.com/doc/embed-videos |
| Curator.io | https://curator.io |

---

## Sources
1. [TikTok Display API Overview](https://developers.tiktok.com/doc/display-api-overview) - Official endpoint and scope documentation
2. [Display API Get Started Guide](https://developers.tiktok.com/doc/display-api-get-started) - OAuth flow and first API call
3. [App Creation Guide](https://developers.tiktok.com/doc/getting-started-create-an-app) - Exact registration steps
4. [App Review FAQ](https://developers.tiktok.com/doc/getting-started-faq) - Review timeline (days to 2 weeks)
5. [TikTok API Rate Limits](https://developers.tiktok.com/doc/tiktok-api-v2-rate-limit) - 600 req/min per endpoint
6. [oEmbed Documentation](https://developers.tiktok.com/doc/embed-videos) - No-approval single video embeds
7. [APIdog Display API Guide](https://apidog.com/blog/guide-to-using-the-tiktok-display-api/) - Practical implementation notes
8. [Elfsight TikTok API Guide](https://elfsight.com/blog/how-to-get-and-use-tiktok-developer-api/) - Step-by-step walkthrough
9. [EchoTik: Is TikTok API Public in 2025](https://www.echotik.live/blog/is-tiktoks-api-public-access-approval-process-2025/) - 2025 process changes
10. [Curator.io: Embed TikTok Feed](https://curator.io/blog/embed-your-tiktok-feed-on-website) - Third-party feed aggregator options
11. [EmbedSocial: Embed TikTok Videos 2026](https://embedsocial.com/blog/embed-tiktok-video/) - Additional embed options

---

*Researched by Romy | April 5, 2026*
