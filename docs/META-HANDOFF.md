# Meta Business Suite -- Setup & Access Guide

**Last updated:** 2026-04-02
**Prepared by:** Alpha Team (for Laura Treto Coaching)

---

## Connected Accounts

### Facebook Page
- **Page Name:** Laura Treto, Fitness Trainer
- **Page ID:** 599537857146045
- **Fans:** ~1,973
- **Access:** business.facebook.com

### Instagram Business Account
- **Handle:** @coachlauratreto
- **Instagram ID:** 17841403861596917
- **Account Type:** Business (connected to FB Page above)

---

## Meta Developer App

- **App Name:** Alpha
- **App ID:** 178221487607084
- **Status:** Active (Development mode)
- **Created by:** Alejandro Vega (alex@alexmene.com)

### Permissions Granted
- instagram_basic
- instagram_content_publish
- instagram_manage_insights
- instagram_manage_comments
- instagram_manage_messages
- pages_manage_posts
- pages_read_engagement
- pages_manage_engagement
- (15+ additional permissions)

---

## What's Working

| Feature | Status | Notes |
|---------|--------|-------|
| IG Profile Read | Working | Can pull profile info, follower count |
| IG Post Engagement | Working | Likes, comments, shares per post |
| IG Post Insights | Working | Reach, impressions, saves per post |
| FB Page Feed | Working | Can read all page posts |
| FB Page Insights | Working | Page-level analytics |
| Publish to IG | Working | Can publish photos/reels via API |
| Publish to FB Page | Working | Can post to FB page via API |

---

## Access Instructions

### For Laura (Day-to-Day)
1. Go to **business.facebook.com**
2. Log in with your Facebook account (Laura Treto Gonzalez)
3. Select "Laura Treto, Fitness Trainer" page
4. Use Business Suite for: scheduling posts, viewing insights, managing messages

### For Codex/AI Integration
- Use the Page Token for automated posting
- Use IG Business Account ID (17841403861596917) for insights queries
- Token refresh: tokens are SHORT-LIVED -- need periodic refresh using App Secret

---

## Token Status

| Token | Type | Status | Action Needed |
|-------|------|--------|---------------|
| User Token | Short-lived | Active | Exchange for long-lived via App Secret |
| Page Token | Short-lived | Active | Derived from user token -- refreshes when user token refreshes |

### How to Refresh Tokens
1. Go to developers.facebook.com -> Alpha app -> Tools -> Graph API Explorer
2. Generate new User Token with all permissions
3. Exchange for long-lived token: `GET /oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_LIVED_TOKEN}`
4. Use long-lived user token to get long-lived page token

---

## Credentials Storage

All credentials are stored in:
- **Config:** `.credentials/api_keys.json` (local, gitignored)

**NEVER share tokens in emails, docs, or public channels.**

---

## Key Contacts
- **App Admin:** Alex Mene (alex@alexmene.com)
- **Account Owner:** Laura Treto (laura@lauratreto.com)
