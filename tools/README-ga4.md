# GA4 Reporter — `tools/ga4_report.py`

Query the GA4 Data API for lauratreto.com from the command line.

## Property info

| Item | Value |
|---|---|
| Property name | Laura Treto Coaching |
| Measurement ID | G-D8L9H56MED |
| Stream ID | 14347946382 |
| Numeric Property ID | **set by you** (see below) |

## One-time setup

### 1. Create a service account

1. Go to https://console.cloud.google.com/ and select (or create) a project.
2. APIs & Services -> Library -> enable **Google Analytics Data API**.
3. APIs & Services -> Credentials -> Create Credentials -> Service account.
4. Give it any name (e.g. `ga4-reporter`). Skip roles. Done.
5. Open the service account -> Keys -> Add key -> JSON. Download.
6. Save the file to `.credentials/ga4-service-account.json` in this project.
   (The `.credentials/` folder is gitignored.)

### 2. Grant access in GA4

1. Open GA4 -> Admin -> Property Access Management.
2. Add the service account email (looks like `ga4-reporter@PROJECT.iam.gserviceaccount.com`).
3. Role: **Viewer**.

### 3. Find the numeric Property ID

1. GA4 -> Admin (bottom-left gear).
2. Under the **Property** column, click **Property Settings** (or "Property details").
3. At the top of the page, copy **Property ID** — a 9-ish-digit number like `412345678`.
   This is NOT the same as the Measurement ID (`G-...`) or the Stream ID.

Provide it one of three ways (first wins):

```bash
# A. CLI flag
python tools/ga4_report.py summary --days 7 --property-id 412345678

# B. Env var
export GA4_PROPERTY_ID=412345678

# C. Config file
echo '{"property_id": "412345678"}' > tools/ga4_config.json
```

### 4. Install deps

```bash
pip install -r tools/requirements.txt
```

## Commands

```bash
python tools/ga4_report.py summary --days 7
python tools/ga4_report.py funnel quiz --days 7
python tools/ga4_report.py sources --days 30
python tools/ga4_report.py events --days 7
python tools/ga4_report.py realtime
```

`--help` works without credentials:

```bash
python tools/ga4_report.py --help
python tools/ga4_report.py summary --help
```

## Weekly KPI Report

`tools/ga4_weekly_report.py` generates a Markdown report for the Friday 3 PM Weekly KPI Check. It pulls the last 7 days, compares to the previous 7 days, and writes to `Output/weekly-kpi-report-YYYY-MM-DD.md`.

Run it every Friday from the project root:

```bash
python3 tools/ga4_weekly_report.py
```

The report includes:

- Traffic summary (users, sessions, page views, engagement rate) with % change vs prior 7 days
- Top 5 pages by views
- Top 5 traffic sources (source / medium) with users + sessions
- Custom events: `quiz_start`, `quiz_complete`, `email_signup`, `trainerize_click`
- Quiz funnel with drop-off %
- Highlights (biggest day, top source, most-viewed page)

It reuses auth + property ID resolution from `ga4_report.py`, so the same `.credentials/ga4-service-account.json` and `tools/ga4_config.json` setup applies. New GA4 properties with zero data return "new" or "—" instead of crashing.

## Gotchas

- **Custom events take ~24 hours** to appear in standard reports (`summary`, `funnel`, `events`, `sources`). The `realtime` endpoint shows them within seconds — use it to sanity-check that tags are firing.
- Realtime dimensions are limited (e.g. no `pagePath` combined with `eventName` in one call). Keep realtime queries simple.
- GA4 has a **14-month retention** on event-level data. Historical queries past that window return zero.
- The service account must be added to the GA4 property with at least Viewer access, or all calls 403.
- Keep `.credentials/ga4-service-account.json` out of git. `.gitignore` covers `.credentials/`.
- Measurement ID vs Property ID vs Stream ID — only the numeric Property ID works with the Data API.
