#!/usr/bin/env python3
"""
tiktok_post.py
--------------
Post a video to TikTok as a DRAFT (Direct Post is OFF — Sandbox mode).

Uses TikTok Content Posting API v2 with FILE_UPLOAD method.
Drafts land in the TikTok app under Creator tools → Drafts.

Usage:
    python tools/tiktok_post.py --video path/to/video.mp4 --title "Your caption" --tags "tag1,tag2"

Required env vars:
    NETLIFY_TOKEN    — Netlify personal access token (for reading Blobs via API)
    NETLIFY_SITE_ID  — Netlify site ID for lauratreto.netlify.app

Optional env vars:
    TIKTOK_ACCESS_TOKEN — Override: skip Blobs lookup and use this token directly

Dependencies:
    requests (pip install requests)

TikTok API docs:
    https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
    https://developers.tiktok.com/doc/content-posting-api-reference-upload-video
"""

import os
import sys
import math
import time
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

CHUNK_SIZE          = 10 * 1024 * 1024          # 10 MB chunks
TIKTOK_INIT_URL     = "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/"
TIKTOK_STATUS_URL   = "https://open.tiktokapis.com/v2/post/publish/status/fetch/"
NETLIFY_BLOBS_URL   = "https://api.netlify.com/api/v1"


# ---------------------------------------------------------------------------
# Token retrieval
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
# Post video as draft
# ---------------------------------------------------------------------------

def post_video_draft(
    video_path: str,
    title: str,
    description: str = "",
    tags: list[str] | None = None,
) -> str:
    """
    Post a video file to TikTok as an inbox draft (Direct Post OFF).

    Returns publish_id on success.
    Exits on error.
    """
    if not os.path.isfile(video_path):
        print(f"ERROR: Video file not found: {video_path}", file=sys.stderr)
        sys.exit(1)

    access_token = get_token()

    video_size  = os.path.getsize(video_path)
    chunk_count = math.ceil(video_size / CHUNK_SIZE)

    # Build caption (title + hashtags)
    caption = title.strip()
    if tags:
        hashtags = " ".join(f"#{t.lstrip('#').strip()}" for t in tags if t.strip())
        if hashtags:
            caption = f"{caption}\n\n{hashtags}"

    # Truncate to TikTok's 2,200-char caption limit
    if len(caption) > 2200:
        caption = caption[:2197] + "..."

    print(f"Initializing TikTok draft upload...")
    print(f"  File:   {video_path}")
    print(f"  Size:   {video_size:,} bytes ({chunk_count} chunk(s))")
    print(f"  Title:  {title}")

    # 1. Init upload
    init_payload = {
        "post_info": {
            "title":                    caption,
            "privacy_level":            "SELF_ONLY",   # SELF_ONLY = draft in inbox
            "disable_duet":             False,
            "disable_stitch":           False,
            "disable_comment":          False,
            "video_cover_timestamp_ms": 1000,
        },
        "source_info": {
            "source":            "FILE_UPLOAD",
            "video_size":        video_size,
            "chunk_size":        CHUNK_SIZE,
            "total_chunk_count": chunk_count,
        },
    }

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type":  "application/json; charset=UTF-8",
    }

    resp = requests.post(TIKTOK_INIT_URL, json=init_payload, headers=headers, timeout=30)

    if not resp.ok:
        print(f"ERROR: TikTok init failed ({resp.status_code}):", file=sys.stderr)
        try:
            print(json.dumps(resp.json(), indent=2), file=sys.stderr)
        except Exception:
            print(resp.text, file=sys.stderr)
        sys.exit(1)

    init_data = resp.json()
    if init_data.get("error", {}).get("code", "ok") != "ok":
        err = init_data["error"]
        print(f"ERROR: TikTok API error: [{err.get('code')}] {err.get('message')}", file=sys.stderr)
        sys.exit(1)

    upload_url = init_data["data"]["upload_url"]
    publish_id = init_data["data"]["publish_id"]

    print(f"  Publish ID: {publish_id}")

    # 2. Upload file in chunks
    with open(video_path, "rb") as fh:
        for chunk_idx in range(chunk_count):
            chunk_data   = fh.read(CHUNK_SIZE)
            start_byte   = chunk_idx * CHUNK_SIZE
            end_byte     = start_byte + len(chunk_data) - 1

            print(f"  Uploading chunk {chunk_idx + 1}/{chunk_count} "
                  f"(bytes {start_byte}-{end_byte})...")

            chunk_headers = {
                "Content-Type":  "video/mp4",
                "Content-Range": f"bytes {start_byte}-{end_byte}/{video_size}",
                "Content-Length": str(len(chunk_data)),
            }

            chunk_resp = requests.put(
                upload_url,
                data=chunk_data,
                headers=chunk_headers,
                timeout=120,
            )

            # TikTok returns 206 for partial, 201 for final chunk
            if chunk_resp.status_code not in (201, 206):
                print(
                    f"ERROR: Chunk upload failed ({chunk_resp.status_code}): {chunk_resp.text}",
                    file=sys.stderr,
                )
                sys.exit(1)

    print(f"\nDraft posted successfully.")
    print(f"  Publish ID: {publish_id}")
    print(f"  Check TikTok app → Creator tools → Drafts to review before publishing.")
    return publish_id


# ---------------------------------------------------------------------------
# Status check
# ---------------------------------------------------------------------------

def check_status(publish_id: str) -> None:
    """Poll TikTok for the processing status of a publish_id."""
    access_token = get_token()

    print(f"Checking status for publish_id: {publish_id}")

    params  = {"fields": "status,fail_reason"}
    payload = {"publish_id": publish_id}
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type":  "application/json; charset=UTF-8",
    }

    resp = requests.post(TIKTOK_STATUS_URL, json=payload, headers=headers,
                         params=params, timeout=30)

    if not resp.ok:
        print(f"ERROR: Status check failed ({resp.status_code}): {resp.text}", file=sys.stderr)
        sys.exit(1)

    data = resp.json()
    if data.get("error", {}).get("code", "ok") != "ok":
        err = data["error"]
        print(f"ERROR: [{err.get('code')}] {err.get('message')}", file=sys.stderr)
        sys.exit(1)

    status_data = data.get("data", {})
    print(f"  Status:      {status_data.get('status', 'unknown')}")
    if status_data.get("fail_reason"):
        print(f"  Fail reason: {status_data['fail_reason']}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Post a video to TikTok as a draft (Direct Post OFF)."
    )
    parser.add_argument("--video",  required=True,  help="Path to the .mp4 video file")
    parser.add_argument("--title",  required=True,  help="Caption / post title (max 2,200 chars)")
    parser.add_argument("--desc",   default="",     help="Optional extended description")
    parser.add_argument("--tags",   default="",     help="Comma-separated hashtags (no # needed)")
    parser.add_argument("--status", default="",     help="Check status of a publish_id instead of posting")

    args = parser.parse_args()

    if args.status:
        check_status(args.status)
        return

    tag_list = [t.strip() for t in args.tags.split(",") if t.strip()] if args.tags else []
    post_video_draft(
        video_path  = args.video,
        title       = args.title,
        description = args.desc,
        tags        = tag_list,
    )


if __name__ == "__main__":
    main()
