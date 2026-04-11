#!/usr/bin/env python3
"""
tiktok_analytics.py
-------------------
CLI analytics tool for Laura Treto Coaching's TikTok account.

Commands:
    python tools/tiktok_analytics.py stats
        Prints account summary (followers, likes, video count).

    python tools/tiktok_analytics.py videos [--limit N]
        Prints a table of recent videos sorted by views descending.
        Default limit: 20 (TikTok max per page is 20).

Required env vars:
    NETLIFY_TOKEN    — Netlify personal access token (for reading Blobs via API)
    NETLIFY_SITE_ID  — Netlify site ID for lauratreto.netlify.app

Optional env vars:
    TIKTOK_ACCESS_TOKEN — Override: skip Blobs lookup and use this token directly

Dependencies:
    requests (pip install requests)

TikTok API docs:
    https://developers.tiktok.com/doc/tiktok-api-v2-user-info
    https://developers.tiktok.com/doc/tiktok-api-v2-video-list
"""

import os
import sys
import argparse
import json

try:
    import requests
except ImportError:
    print("ERROR: requests library not installed. Run: pip install requests", file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

NETLIFY_BLOBS_URL    = "https://api.netlify.com/api/v1"
TIKTOK_USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/"
TIKTOK_VIDEO_LIST_URL = "https://open.tiktokapis.com/v2/video/list/"


# ---------------------------------------------------------------------------
# Token retrieval (copied from tiktok_post.py)
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

    # Netlify Blobs REST API: GET /api/v1/blobs/{site_id}/{store}/{key}
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

    # Basic expiry check (expires_in is seconds from obtained_at)
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
# Helpers
# ---------------------------------------------------------------------------

def _check_tiktok_error(data: dict) -> None:
    """Print TikTok API error and exit if the response contains one."""
    err = data.get("error", {})
    code = err.get("code", "ok")
    if code != "ok" and code != 0:
        msg = err.get("message", "unknown error")
        log_id = err.get("log_id", "")
        print(f"ERROR: TikTok API error [{code}]: {msg}", file=sys.stderr)
        if log_id:
            print(f"  log_id: {log_id}", file=sys.stderr)
        sys.exit(1)


def _fmt(n) -> str:
    """Format an integer with commas, or return 'N/A' if None."""
    if n is None:
        return "N/A"
    try:
        return f"{int(n):,}"
    except (ValueError, TypeError):
        return str(n)


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

def cmd_stats() -> None:
    """Fetch and print account summary stats."""
    access_token = get_token()

    fields = "follower_count,following_count,likes_count,video_count,display_name,username"
    resp = requests.get(
        TIKTOK_USER_INFO_URL,
        params={"fields": fields},
        headers={
            "Authorization": f"Bearer {access_token}",
        },
        timeout=15,
    )

    if not resp.ok:
        print(f"ERROR: TikTok user info request failed ({resp.status_code}): {resp.text}", file=sys.stderr)
        sys.exit(1)

    data = resp.json()
    _check_tiktok_error(data)

    user = data.get("data", {}).get("user", {})

    username     = user.get("username") or user.get("display_name") or "unknown"
    display_name = user.get("display_name", "")
    followers    = user.get("follower_count")
    following    = user.get("following_count")
    likes        = user.get("likes_count")
    videos       = user.get("video_count")

    print()
    if display_name and display_name != username:
        print(f"  {display_name} (@{username})")
    else:
        print(f"  @{username}")
    print(f"  Followers:   {_fmt(followers)}")
    print(f"  Following:   {_fmt(following)}")
    print(f"  Total likes: {_fmt(likes)}")
    print(f"  Videos:      {_fmt(videos)}")
    print()


def cmd_videos(limit: int = 20) -> None:
    """Fetch and print a table of recent videos sorted by views descending."""
    # TikTok max per page is 20
    max_count = min(limit, 20)

    access_token = get_token()

    fields = "id,title,create_time,statistics"
    payload = {
        "max_count": max_count,
        "fields": fields,
    }

    resp = requests.post(
        TIKTOK_VIDEO_LIST_URL,
        params={"fields": fields},
        json=payload,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type":  "application/json; charset=UTF-8",
        },
        timeout=15,
    )

    if not resp.ok:
        print(f"ERROR: TikTok video list request failed ({resp.status_code}): {resp.text}", file=sys.stderr)
        sys.exit(1)

    data = resp.json()
    _check_tiktok_error(data)

    videos = data.get("data", {}).get("videos", [])

    if not videos:
        print("No videos returned.")
        return

    # Sort by view_count descending
    def view_count(v):
        return v.get("statistics", {}).get("view_count") or 0

    videos_sorted = sorted(videos, key=view_count, reverse=True)

    # Print table
    col_views   = 8
    col_likes   = 7
    col_cmts    = 6
    col_shares  = 8
    col_title   = 50

    header = (
        f"{'Views':>{col_views}}  "
        f"{'Likes':>{col_likes}}  "
        f"{'Cmts':>{col_cmts}}  "
        f"{'Shares':>{col_shares}}  "
        f"{'Title':<{col_title}}"
    )
    divider = (
        f"{'-' * col_views}  "
        f"{'-' * col_likes}  "
        f"{'-' * col_cmts}  "
        f"{'-' * col_shares}  "
        f"{'-' * col_title}"
    )

    print()
    print(header)
    print(divider)

    for v in videos_sorted:
        stats  = v.get("statistics", {})
        views  = stats.get("view_count")
        likes  = stats.get("like_count")
        cmts   = stats.get("comment_count")
        shares = stats.get("share_count")
        title  = (v.get("title") or "(no title)").replace("\n", " ")

        # Truncate title to col_title chars
        if len(title) > col_title:
            title = title[:col_title - 1] + "…"

        print(
            f"{_fmt(views):>{col_views}}  "
            f"{_fmt(likes):>{col_likes}}  "
            f"{_fmt(cmts):>{col_cmts}}  "
            f"{_fmt(shares):>{col_shares}}  "
            f"{title:<{col_title}}"
        )

    print()
    print(f"  Showing {len(videos_sorted)} video(s).")
    print()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="TikTok analytics CLI for Laura Treto Coaching."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # stats sub-command
    subparsers.add_parser("stats", help="Print account summary stats.")

    # videos sub-command
    videos_parser = subparsers.add_parser("videos", help="Print recent videos sorted by views.")
    videos_parser.add_argument(
        "--limit",
        type=int,
        default=20,
        metavar="N",
        help="Number of videos to fetch (default: 20, max: 20).",
    )

    args = parser.parse_args()

    if args.command == "stats":
        cmd_stats()
    elif args.command == "videos":
        cmd_videos(limit=args.limit)


if __name__ == "__main__":
    main()
