# Infographic Pipeline — Alpha Playbook

**Owner:** Kai (Internal Tools)  
**Purpose:** End-to-end workflow from content idea to branded Instagram post.  
**Last updated:** 2026-04-09

---

## Overview

```
[Content Definition JSON]
        |
        v
[1. Pick Template] --> infographic_pipeline.py --list-templates
        |
        v
[2. Fill Content]  --> infographic_pipeline.py --template <id> --content <file.json>
        |            (prints filled Canva prompt + instructions)
        v
[3. Canva Design]  --> Alpha: mcp__claude_ai_Canva__generate-design
        |
        v
[4. Export PNG]    --> Alpha: mcp__claude_ai_Canva__export-design (PNG, 1080x1350)
        |
        v
[5. Post to IG]    --> post_to_instagram.py --image-url "..." --caption "..."
        |            OR: infographic_pipeline.py --post --image-url "..." --caption "..."
        v
[6. Log to DB]     --> auto-logged to alpha.db content_log
```

---

## Files in this directory

| File | Purpose |
|------|---------|
| `infographic_pipeline.py` | Main orchestration script — content loading, prompt generation, posting |
| `post_to_instagram.py` | Standalone Instagram poster (single image + carousel) |
| `infographic_templates.json` | 5 branded template definitions with Canva prompts |
| `INFOGRAPHIC-PIPELINE.md` | This playbook |

---

## Step-by-Step Instructions for Alpha

### Step 1: Define Content

Create a small JSON file (or pass content inline) matching the template's fields.

Example for `tip` template (`content.json`):
```json
{
  "headline": "Stop Stretching Cold Muscles",
  "body": "Dynamic warm-up activates 3x more muscle fibers than static stretching",
  "cta": "Take the free Movement Quiz — link in bio"
}
```

### Step 2: Pick a Template and Generate Canva Prompt

```bash
# List available templates
python tools/infographic_pipeline.py --list-templates

# Generate the filled Canva prompt
python tools/infographic_pipeline.py --template tip --content tools/content.json
```

The script prints the exact prompt to pass to Canva MCP.

### Step 3: Generate Design via Canva MCP

Alpha calls:
```
Tool: mcp__claude_ai_Canva__generate-design
Input prompt: <filled prompt from Step 2>
```

Note the returned design ID.

### Step 4: Export Design as PNG

Alpha calls:
```
Tool: mcp__claude_ai_Canva__export-design
Design ID: <from Step 3>
Format: PNG
Dimensions: 1080 x 1350
```

Copy the exported PNG URL (must be a public HTTPS URL).

### Step 5: Post to Instagram

**Option A: via infographic_pipeline.py**
```bash
python tools/infographic_pipeline.py \
  --post \
  --template tip \
  --image-url "https://export.canva.com/..." \
  --caption "Stop stretching cold muscles. Dynamic warm-up activates 3x more muscle fibers. Take the free Movement Quiz — link in bio. #movementcoach #fitnesstips #keywest #wellness #lauratreto"
```

**Option B: via post_to_instagram.py directly**
```bash
python tools/post_to_instagram.py \
  --image-url "https://export.canva.com/..." \
  --caption "Your caption here"
```

**Carousel post (multiple images):**
```bash
python tools/post_to_instagram.py \
  --carousel \
  --image-urls "https://url1.png,https://url2.png,https://url3.png" \
  --caption "Swipe for all 3 tips..."
```

### Step 6: Log to DB

`infographic_pipeline.py --post` auto-logs to `alpha.db content_log`.

For manual logging via sqlite3:
```sql
INSERT INTO content_log (platform, post_type, caption, image_url, external_id, template_id, posted_at)
VALUES ('instagram', 'tip', '<caption>', '<image_url>', '<ig_post_id>', 'tip', datetime('now'));
```

---

## Template Reference

| ID | Name | Pillar | Key Fields |
|----|------|--------|------------|
| `tip` | Quick Tip | movement_authority | headline, body, cta |
| `stat` | Stat Highlight | movement_authority | stat, body, cta |
| `quote` | Inspirational Quote | trauma_empowerment | quote, attribution |
| `myth_vs_fact` | Myth vs Fact | movement_authority | myth, fact |
| `client_spotlight` | Client Spotlight | cta_proof | client_name, testimonial, result |

All templates use brand colors: coral #E8654A, turquoise #1A7A7A, warm white #FAF7F2, charcoal #2B2B2B, gold #C5973E.

---

## Caption Formula

```
[Hook sentence based on content]
[1-2 lines of value]
[CTA — e.g., "Book your free Movement Assessment — link in bio"]
.
#movementcoach #[topic] #keywest #[pillar tag] #lauratreto
```

Max 5 hashtags per platform. Bilingual option: add Spanish line before hashtags.

---

## Credentials

Read from `.credentials/api_keys.json`:
- `meta.page_token` — permanent page token (never expires)
- `meta.instagram_id` — `17841403861596917`

The `long_lived_user_token` expires 2026-06-03. Renew before then.

---

## Requirements

```bash
pip install requests
```

No other third-party dependencies.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `image_url must be a valid URL` | Canva export URL must be public HTTPS, not a local path |
| `Media posted before it's ready` | Image host may need a moment; retry after 5 sec |
| `Token expired` | Check `.credentials/api_keys.json` — use `page_token` (permanent), not `long_lived_user_token` |
| `DB log fails` | alpha.db may not have `content_log.template_id` column — run `build_alpha_db.py` to rebuild |
