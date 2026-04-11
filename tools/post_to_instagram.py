#!/usr/bin/env python3
"""
Post an image to Instagram via Meta Graph API.

Usage:
  python post_to_instagram.py --image-url "https://..." --caption "Your caption here"
  python post_to_instagram.py --carousel --image-urls "url1,url2,url3" --caption "Caption"

Requirements:
  pip install requests

Reads credentials from ../.credentials/api_keys.json
  - meta.page_token       (permanent page token)
  - meta.instagram_id     (IG business account ID)
"""

import argparse
import json
import sys
import os
import requests

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_PATH = os.path.join(SCRIPT_DIR, "..", ".credentials", "api_keys.json")
GRAPH_BASE = "https://graph.facebook.com/v21.0"


# ---------------------------------------------------------------------------
# Credential loader
# ---------------------------------------------------------------------------
def load_credentials():
    with open(CREDENTIALS_PATH, "r") as f:
        creds = json.load(f)
    meta = creds.get("meta", {})
    token = meta.get("page_token")
    ig_id = meta.get("instagram_id")
    if not token or not ig_id:
        print("ERROR: page_token or instagram_id missing from credentials file.")
        sys.exit(1)
    return token, ig_id


# ---------------------------------------------------------------------------
# Single image post
# ---------------------------------------------------------------------------
def post_single(token: str, ig_id: str, image_url: str, caption: str) -> dict:
    """Create a media container then publish it. Returns API response dict."""

    print(f"[1/2] Creating media container for: {image_url}")
    r = requests.post(
        f"{GRAPH_BASE}/{ig_id}/media",
        params={
            "image_url": image_url,
            "caption": caption,
            "access_token": token,
        },
        timeout=30,
    )
    r.raise_for_status()
    creation_id = r.json().get("id")
    if not creation_id:
        print(f"ERROR: No creation_id returned. Response: {r.json()}")
        sys.exit(1)
    print(f"  Container ID: {creation_id}")

    print("[2/2] Publishing...")
    r2 = requests.post(
        f"{GRAPH_BASE}/{ig_id}/media_publish",
        params={
            "creation_id": creation_id,
            "access_token": token,
        },
        timeout=30,
    )
    r2.raise_for_status()
    result = r2.json()
    print(f"  Published! Post ID: {result.get('id')}")
    return result


# ---------------------------------------------------------------------------
# Carousel post
# ---------------------------------------------------------------------------
def post_carousel(token: str, ig_id: str, image_urls: list, caption: str) -> dict:
    """Create child containers, a parent carousel container, then publish."""

    if len(image_urls) < 2 or len(image_urls) > 10:
        print("ERROR: Carousel requires 2-10 images.")
        sys.exit(1)

    # Step 1: create each child container
    child_ids = []
    for i, url in enumerate(image_urls, 1):
        print(f"[{i}/{len(image_urls)+2}] Creating child container: {url}")
        r = requests.post(
            f"{GRAPH_BASE}/{ig_id}/media",
            params={
                "image_url": url,
                "is_carousel_item": "true",
                "access_token": token,
            },
            timeout=30,
        )
        r.raise_for_status()
        child_id = r.json().get("id")
        if not child_id:
            print(f"ERROR: No id for child {i}. Response: {r.json()}")
            sys.exit(1)
        child_ids.append(child_id)
        print(f"  Child {i} ID: {child_id}")

    # Step 2: create parent carousel container
    step = len(image_urls) + 1
    print(f"[{step}/{len(image_urls)+2}] Creating parent carousel container...")
    r = requests.post(
        f"{GRAPH_BASE}/{ig_id}/media",
        params={
            "media_type": "CAROUSEL",
            "children": ",".join(child_ids),
            "caption": caption,
            "access_token": token,
        },
        timeout=30,
    )
    r.raise_for_status()
    carousel_id = r.json().get("id")
    if not carousel_id:
        print(f"ERROR: No carousel container id. Response: {r.json()}")
        sys.exit(1)
    print(f"  Carousel container ID: {carousel_id}")

    # Step 3: publish
    step += 1
    print(f"[{step}/{len(image_urls)+2}] Publishing carousel...")
    r2 = requests.post(
        f"{GRAPH_BASE}/{ig_id}/media_publish",
        params={
            "creation_id": carousel_id,
            "access_token": token,
        },
        timeout=30,
    )
    r2.raise_for_status()
    result = r2.json()
    print(f"  Published! Post ID: {result.get('id')}")
    return result


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Post image(s) to Instagram via Meta Graph API.")
    parser.add_argument("--image-url", help="Single image URL (publicly accessible HTTPS)")
    parser.add_argument("--caption", required=True, help="Post caption")
    parser.add_argument("--carousel", action="store_true", help="Post as carousel")
    parser.add_argument(
        "--image-urls",
        help="Comma-separated image URLs for carousel (2-10 images)",
    )
    args = parser.parse_args()

    token, ig_id = load_credentials()

    if args.carousel:
        if not args.image_urls:
            print("ERROR: --image-urls required for carousel posts.")
            sys.exit(1)
        urls = [u.strip() for u in args.image_urls.split(",") if u.strip()]
        result = post_carousel(token, ig_id, urls, args.caption)
    else:
        if not args.image_url:
            print("ERROR: --image-url required for single image posts.")
            sys.exit(1)
        result = post_single(token, ig_id, args.image_url, args.caption)

    print(f"\nDone. Full response: {json.dumps(result, indent=2)}")


if __name__ == "__main__":
    main()
