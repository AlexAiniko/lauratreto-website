#!/usr/bin/env python3
"""
tiktok_comments.py
------------------
CLI tool to read and auto-reply to TikTok comments on Laura Treto's videos.
Uses Claude Haiku to classify buying signals and generate warm replies.

Commands:
    list       -- list comments on a video
    reply      -- post a single reply to a comment
    auto-reply -- auto-detect buying signals and reply in Laura's voice

Usage:
    python tools/tiktok_comments.py list --video VIDEO_ID [--limit 20]
    python tools/tiktok_comments.py reply --video VIDEO_ID --comment COMMENT_ID --text "reply text"
    python tools/tiktok_comments.py auto-reply --video VIDEO_ID [--dry-run]

Required env vars:
    NETLIFY_TOKEN       -- Netlify personal access token (for Blobs)
    NETLIFY_SITE_ID     -- Netlify site ID for lauratreto.netlify.app
    ANTHROPIC_API_KEY   -- Anthropic API key for Claude Haiku

Optional env vars:
    TIKTOK_ACCESS_TOKEN -- Override: skip Blobs lookup and use this token directly
"""

import os
import sys
import json
import argparse

try:
    import requests
except ImportError:
    print("ERROR: requests library not installed. Run: pip install requests", file=sys.stderr)
    sys.exit(1)

try:
    import anthropic
except ImportError:
    print("ERROR: anthropic library not installed. Run: pip install anthropic", file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

TIKTOK_COMMENT_LIST_URL   = "https://open.tiktokapis.com/v2/video/comment/list/"
TIKTOK_COMMENT_CREATE_URL = "https://open.tiktokapis.com/v2/video/comment/create/"
NETLIFY_BLOBS_URL         = "https://api.netlify.com/api/v1"
BOOKING_LINK              = "https://lauratreto.com"
CLAUDE_MODEL              = "claude-haiku-4-5-20251001"
COMMENT_FIELDS            = "id,text,like_count,reply_count,create_time,username"


# ---------------------------------------------------------------------------
# Token retrieval (mirrors tiktok_post.py pattern exactly)
# ---------------------------------------------------------------------------

def get_token() -> str:
    """
    Retrieve the TikTok access_token from Netlify Blobs.
    Falls back to TIKTOK_ACCESS_TOKEN env var if set.
    Exits with a clear error if token is missing or appears expired.
    """
    # Direct override
    direct = os.environ.get("TIKTOK_ACCESS_TOKEN", "").strip()
    if direct:
        return direct

    netlify_token = os.environ.get("NETLIFY_TOKEN", "").strip()
    netlify_site  = os.environ.get("NETLIFY_SITE_ID", "").strip()

    if not netlify_token or not netlify_site:
        print(
            "ERROR: NETLIFY_TOKEN and NETLIFY_SITE_ID env vars are required to read tokens from Blobs.\n"
            "  Alternative: set TIKTOK_ACCESS_TOKEN directly.",
            file=sys.stderr,
        )
        sys.exit(1)

    url = f"{NETLIFY_BLOBS_URL}/blobs/{netlify_site}/tiktok-auth/laura-token"
    resp = requests.get(
        url,
        headers={"Authorization": f"Bearer {netlify_token}"},
        timeout=15,
    )

    if resp.status_code == 404:
        print(
            "ERROR: No TikTok token found in Netlify Blobs.\n"
            "  Run: python tools/tiktok_authorize.py",
            file=sys.stderr,
        )
        sys.exit(1)

    if not resp.ok:
        print(
            f"ERROR: Netlify Blobs returned {resp.status_code}: {resp.text}",
            file=sys.stderr,
        )
        sys.exit(1)

    try:
        data = resp.json()
    except Exception:
        print("ERROR: Could not parse token JSON from Netlify Blobs.", file=sys.stderr)
        sys.exit(1)

    access_token = data.get("access_token", "").strip()
    if not access_token:
        print(
            "ERROR: access_token missing in stored token record.\n"
            "  Re-run: python tools/tiktok_authorize.py",
            file=sys.stderr,
        )
        sys.exit(1)

    # Basic expiry check
    obtained_at = data.get("obtained_at")
    expires_in  = data.get("expires_in", 0)
    if obtained_at and expires_in:
        from datetime import datetime, timezone
        try:
            obtained_dt = datetime.fromisoformat(obtained_at.replace("Z", "+00:00"))
            age_secs    = (datetime.now(timezone.utc) - obtained_dt).total_seconds()
            if age_secs >= expires_in:
                print(
                    f"ERROR: TikTok access token expired (age {int(age_secs)}s, limit {expires_in}s).\n"
                    "  Re-run: python tools/tiktok_authorize.py",
                    file=sys.stderr,
                )
                sys.exit(1)
        except Exception:
            pass  # If date parsing fails, proceed and let TikTok reject it

    return access_token


# ---------------------------------------------------------------------------
# TikTok API helpers
# ---------------------------------------------------------------------------

def fetch_comments(video_id: str, limit: int = 20) -> list[dict]:
    """
    Fetch up to `limit` comments for a given video_id.
    Returns a list of comment dicts.
    """
    access_token = get_token()
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type":  "application/json; charset=UTF-8",
    }
    params = {
        "video_id": video_id,
        "fields":   COMMENT_FIELDS,
        "count":    limit,
    }

    resp = requests.get(TIKTOK_COMMENT_LIST_URL, headers=headers, params=params, timeout=30)

    if not resp.ok:
        print(f"ERROR: TikTok comment list failed ({resp.status_code}):", file=sys.stderr)
        try:
            print(json.dumps(resp.json(), indent=2), file=sys.stderr)
        except Exception:
            print(resp.text, file=sys.stderr)
        sys.exit(1)

    data = resp.json()
    err  = data.get("error", {})
    if err.get("code", "ok") != "ok":
        print(f"ERROR: TikTok API error: [{err.get('code')}] {err.get('message')}", file=sys.stderr)
        sys.exit(1)

    return data.get("data", {}).get("comments", [])


def post_reply(video_id: str, comment_id: str, reply_text: str) -> bool:
    """
    Post a reply to a specific comment on a video.
    Returns True on success, False on failure.
    """
    access_token = get_token()
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type":  "application/json; charset=UTF-8",
    }
    payload = {
        "video_id":          video_id,
        "text":              reply_text,
        "parent_comment_id": comment_id,
    }

    resp = requests.post(TIKTOK_COMMENT_CREATE_URL, headers=headers, json=payload, timeout=30)

    if not resp.ok:
        print(f"ERROR: TikTok comment create failed ({resp.status_code}):", file=sys.stderr)
        try:
            print(json.dumps(resp.json(), indent=2), file=sys.stderr)
        except Exception:
            print(resp.text, file=sys.stderr)
        return False

    data = resp.json()
    err  = data.get("error", {})
    if err.get("code", "ok") != "ok":
        print(f"ERROR: [{err.get('code')}] {err.get('message')}", file=sys.stderr)
        return False

    return True


# ---------------------------------------------------------------------------
# Claude AI classifier + reply generator
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = f"""You are Laura Treto, a movement and longevity coach based in Key West, FL. You have 15 years performing with Acosta Danza and a Clinical Psychology degree. You coach adults 40+ on strength, mobility, and confidence.

Comment: "{{comment_text}}"

First, decide: is this a buying signal? (asking about price, booking, programs, how to start, how to sign up, how to work with you, etc.)
Reply with JSON: {{"is_buying_signal": true/false, "reply": "your warm, brief reply if buying signal, else null"}}

If it IS a buying signal, write a warm 1-2 sentence reply that:
- Sounds like Laura (warm, direct, not salesy)
- Answers the question briefly
- Ends with a CTA: "Book a free consult at {BOOKING_LINK}" or "DM me or visit {BOOKING_LINK} to get started"
- Never uses em dashes
- Max 150 characters (TikTok comment limit consideration)"""


def classify_and_reply(comment_text: str) -> dict:
    """
    Use Claude Haiku to classify a comment as a buying signal and generate a reply.
    Returns dict with keys: is_buying_signal (bool), reply (str or None).
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY env var is required for auto-reply.", file=sys.stderr)
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    prompt = SYSTEM_PROMPT.replace("{comment_text}", comment_text.replace('"', '\\"'))

    message = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=256,
        messages=[
            {"role": "user", "content": prompt}
        ],
    )

    raw = message.content[0].text.strip()

    # Extract JSON from response (handle markdown code blocks if present)
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        result = json.loads(raw)
        return {
            "is_buying_signal": bool(result.get("is_buying_signal", False)),
            "reply":            result.get("reply") or None,
        }
    except json.JSONDecodeError:
        # Fallback: try to extract is_buying_signal from raw text
        lower = raw.lower()
        is_signal = "true" in lower and "is_buying_signal" in lower
        return {"is_buying_signal": is_signal, "reply": None}


# ---------------------------------------------------------------------------
# CLI commands
# ---------------------------------------------------------------------------

def cmd_list(args):
    """List comments on a video with index numbers."""
    comments = fetch_comments(args.video, limit=args.limit)

    if not comments:
        print("No comments found.")
        return

    print(f"Comments on video {args.video} ({len(comments)} shown):\n")
    for i, c in enumerate(comments):
        username   = c.get("username", "unknown")
        text       = c.get("text", "")
        like_count = c.get("like_count", 0)
        reply_count= c.get("reply_count", 0)
        replied    = " [has replies]" if reply_count > 0 else ""
        print(f"[{i}] @{username} ({like_count} likes){replied}: \"{text}\"")
        print(f"     ID: {c.get('id', 'N/A')}")


def cmd_reply(args):
    """Post a single reply to a specific comment."""
    print(f"Replying to comment {args.comment} on video {args.video}...")
    print(f"  Text: {args.text}")

    success = post_reply(args.video, args.comment, args.text)

    if success:
        print("Reply posted successfully.")
    else:
        print("Failed to post reply.", file=sys.stderr)
        sys.exit(1)


def cmd_auto_reply(args):
    """
    Fetch comments, classify buying signals via Claude, and post replies.
    --dry-run prints what would be sent without posting.
    """
    print(f"Fetching comments for video {args.video}...")
    comments = fetch_comments(args.video, limit=20)

    if not comments:
        print("No comments found.")
        return

    print(f"Found {len(comments)} comment(s). Analyzing for buying signals...\n")

    replied    = 0
    skipped    = 0
    no_signal  = 0

    for c in comments:
        comment_id   = c.get("id", "")
        username     = c.get("username", "unknown")
        text         = c.get("text", "")
        reply_count  = c.get("reply_count", 0)

        # Skip comments that already have replies
        if reply_count > 0:
            print(f"SKIP (already replied) @{username}: \"{text}\"")
            skipped += 1
            continue

        # Classify with Claude
        result = classify_and_reply(text)

        if not result["is_buying_signal"]:
            print(f"NO SIGNAL  @{username}: \"{text}\"")
            no_signal += 1
            continue

        reply_text = result["reply"]
        if not reply_text:
            print(f"SIGNAL (no reply generated) @{username}: \"{text}\"")
            skipped += 1
            continue

        print(f"BUYING SIGNAL @{username}: \"{text}\"")
        print(f"  -> Reply: {reply_text}")

        if args.dry_run:
            print("  [DRY RUN] Would post reply above.")
        else:
            success = post_reply(args.video, comment_id, reply_text)
            if success:
                print("  -> Posted.")
                replied += 1
            else:
                print("  -> Failed to post.", file=sys.stderr)

        print()

    print(f"\nSummary: {replied} replied, {skipped} skipped, {no_signal} no signal.")
    if args.dry_run and replied == 0:
        print("(dry-run mode: no replies were actually posted)")


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Read and auto-reply to TikTok comments on Laura Treto's videos."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # list subcommand
    list_parser = subparsers.add_parser("list", help="List comments on a video")
    list_parser.add_argument("--video", required=True, help="TikTok video ID")
    list_parser.add_argument("--limit", type=int, default=20, help="Max comments to fetch (default: 20)")

    # reply subcommand
    reply_parser = subparsers.add_parser("reply", help="Post a reply to a specific comment")
    reply_parser.add_argument("--video",   required=True, help="TikTok video ID")
    reply_parser.add_argument("--comment", required=True, help="Comment ID to reply to")
    reply_parser.add_argument("--text",    required=True, help="Reply text")

    # auto-reply subcommand
    auto_parser = subparsers.add_parser("auto-reply", help="Auto-reply to buying signal comments")
    auto_parser.add_argument("--video",   required=True,          help="TikTok video ID")
    auto_parser.add_argument("--dry-run", action="store_true",    help="Print replies without posting")

    args = parser.parse_args()

    if args.command == "list":
        cmd_list(args)
    elif args.command == "reply":
        cmd_reply(args)
    elif args.command == "auto-reply":
        cmd_auto_reply(args)


if __name__ == "__main__":
    main()
