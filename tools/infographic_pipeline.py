#!/usr/bin/env python3
"""
Infographic Content Pipeline — Orchestration Script
Laura Treto Coaching

This script is the entry point for the infographic pipeline.
It handles the parts that are pure Python (content loading, DB logging,
Instagram posting). The Canva design step is documented for Alpha to
orchestrate via the Canva MCP tools.

Usage:
  python infographic_pipeline.py --template tip --content content.json
  python infographic_pipeline.py --list-templates
  python infographic_pipeline.py --post --image-url "https://..." --caption "..." [--template tip]

Requirements:
  pip install requests

Full workflow: see INFOGRAPHIC-PIPELINE.md
"""

import argparse
import json
import os
import sys
import sqlite3
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.join(SCRIPT_DIR, "..")
TEMPLATES_PATH = os.path.join(SCRIPT_DIR, "infographic_templates.json")
CREDENTIALS_PATH = os.path.join(PROJECT_ROOT, ".credentials", "api_keys.json")
DB_PATH = os.path.join(PROJECT_ROOT, "alpha.db")
POST_SCRIPT = os.path.join(SCRIPT_DIR, "post_to_instagram.py")


# ---------------------------------------------------------------------------
# Template helpers
# ---------------------------------------------------------------------------
def load_templates():
    with open(TEMPLATES_PATH, "r") as f:
        return json.load(f)


def get_template(template_id: str):
    for t in load_templates():
        if t["id"] == template_id:
            return t
    return None


def fill_template_prompt(template: dict, content: dict) -> str:
    """Fill the Canva prompt template with content values."""
    prompt = template["canva_prompt_template"]
    for key, value in content.items():
        prompt = prompt.replace(f"{{{key}}}", str(value))
    return prompt


def list_templates():
    templates = load_templates()
    print(f"{'ID':<20} {'Name':<25} {'Pillar'}")
    print("-" * 65)
    for t in templates:
        print(f"{t['id']:<20} {t['name']:<25} {t['pillar']}")
    print()
    print("Use --template <id> to select one.")


# ---------------------------------------------------------------------------
# DB logging
# ---------------------------------------------------------------------------
def log_to_db(template_id: str, caption: str, image_url: str, post_id: str, platform: str = "instagram"):
    """Log a published post to alpha.db content_log table."""
    if not os.path.exists(DB_PATH):
        print(f"  [DB] alpha.db not found at {DB_PATH}, skipping log.")
        return
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO content_log
              (platform, post_type, caption, image_url, external_id, template_id, posted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                platform,
                template_id,
                caption,
                image_url,
                post_id,
                template_id,
                datetime.utcnow().isoformat(),
            ),
        )
        conn.commit()
        conn.close()
        print(f"  [DB] Logged to content_log (post_id={post_id})")
    except Exception as e:
        print(f"  [DB] Warning: could not log to alpha.db: {e}")


# ---------------------------------------------------------------------------
# Pipeline steps (documented for Alpha)
# ---------------------------------------------------------------------------
def print_canva_instructions(template: dict, content: dict):
    """Print the Canva MCP prompt Alpha should use to generate the design."""
    prompt = fill_template_prompt(template, content)
    print()
    print("=" * 70)
    print("STEP 2: CANVA DESIGN (Alpha — use Canva MCP)")
    print("=" * 70)
    print()
    print("Tool: mcp__claude_ai_Canva__generate-design")
    print("Prompt to pass:")
    print()
    print(f'  "{prompt}"')
    print()
    print("After generation:")
    print("  Tool: mcp__claude_ai_Canva__export-design")
    print("  Format: PNG, size: 1080x1350")
    print("  Copy the exported PNG URL, then run:")
    print()
    print(f'  python post_to_instagram.py --image-url "<PNG_URL>" --caption "<CAPTION>"')
    print()


# ---------------------------------------------------------------------------
# Post step (calls post_to_instagram.py via subprocess)
# ---------------------------------------------------------------------------
def post_to_instagram(image_url: str, caption: str, template_id: str = "unknown"):
    import subprocess
    print()
    print("=" * 70)
    print("STEP 4: POSTING TO INSTAGRAM")
    print("=" * 70)
    cmd = [
        sys.executable,
        POST_SCRIPT,
        "--image-url", image_url,
        "--caption", caption,
    ]
    result = subprocess.run(cmd, capture_output=False)
    if result.returncode != 0:
        print("ERROR: post_to_instagram.py failed.")
        sys.exit(1)
    # Attempt to log (post_id unknown here unless we parse output — skip for now)
    log_to_db(template_id, caption, image_url, post_id="see_instagram", platform="instagram")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="Laura Treto Infographic Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # List available templates
  python infographic_pipeline.py --list-templates

  # Generate Canva prompt for a tip infographic
  python infographic_pipeline.py --template tip --content content.json

  # Post an already-exported image directly
  python infographic_pipeline.py --post --image-url "https://..." --caption "Your caption" --template tip
        """,
    )
    parser.add_argument("--list-templates", action="store_true", help="List all available templates")
    parser.add_argument("--template", help="Template ID (tip, stat, quote, myth_vs_fact, client_spotlight)")
    parser.add_argument("--content", help="Path to JSON file with content fields")
    parser.add_argument("--post", action="store_true", help="Post to Instagram (requires --image-url and --caption)")
    parser.add_argument("--image-url", help="Public HTTPS URL of the PNG to post")
    parser.add_argument("--caption", help="Instagram caption")
    args = parser.parse_args()

    # Mode 1: list templates
    if args.list_templates:
        list_templates()
        return

    # Mode 2: generate Canva prompt from template + content file
    if args.template and args.content and not args.post:
        template = get_template(args.template)
        if not template:
            print(f"ERROR: Template '{args.template}' not found. Use --list-templates to see options.")
            sys.exit(1)
        with open(args.content, "r") as f:
            content = json.load(f)
        print()
        print("=" * 70)
        print(f"STEP 1: CONTENT LOADED — Template: {template['name']} ({args.template})")
        print("=" * 70)
        print(json.dumps(content, indent=2))
        print_canva_instructions(template, content)
        return

    # Mode 3: post an image to Instagram
    if args.post:
        if not args.image_url or not args.caption:
            print("ERROR: --post requires --image-url and --caption.")
            sys.exit(1)
        post_to_instagram(args.image_url, args.caption, args.template or "unknown")
        return

    # Default: show help
    parser.print_help()


if __name__ == "__main__":
    main()
