#!/usr/bin/env python3
"""
Weekly KPI Report generator for lauratreto.com.

Runs every Friday 3pm (manual) as part of the Weekly KPI Check.
Pulls last 7 days from GA4, compares to previous 7 days, and writes a
Markdown report to Output/weekly-kpi-report-YYYY-MM-DD.md.

Usage:
    python3 tools/ga4_weekly_report.py

Requirements:
    - .credentials/ga4-service-account.json
    - tools/ga4_config.json with { "property_id": "..." }
    - pip install -r tools/requirements.txt

This script reuses auth + property resolution from tools/ga4_report.py.
"""

from __future__ import annotations

import sys
from datetime import date, timedelta
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_DIR = PROJECT_ROOT / "Output"

# Reuse helpers from ga4_report.py
sys.path.insert(0, str(SCRIPT_DIR))
from ga4_report import _load_client, resolve_property_id  # noqa: E402


# ---------- date helpers ----------


def week_monday(d: date) -> date:
    """Return the Monday of the week containing `d`."""
    return d - timedelta(days=d.weekday())


def date_str(d: date) -> str:
    return d.strftime("%Y-%m-%d")


# ---------- GA4 query helpers ----------


def _date_range(start: date, end: date):
    from google.analytics.data_v1beta.types import DateRange
    return DateRange(start_date=date_str(start), end_date=date_str(end))


def fetch_totals(client, prop: str, start: date, end: date) -> dict:
    from google.analytics.data_v1beta.types import Metric, RunReportRequest
    resp = client.run_report(
        RunReportRequest(
            property=prop,
            date_ranges=[_date_range(start, end)],
            metrics=[
                Metric(name="totalUsers"),
                Metric(name="sessions"),
                Metric(name="screenPageViews"),
                Metric(name="engagementRate"),
            ],
        )
    )
    if not resp.rows:
        return {"users": 0, "sessions": 0, "page_views": 0, "engagement_rate": 0.0}
    r = resp.rows[0]
    return {
        "users": int(r.metric_values[0].value or 0),
        "sessions": int(r.metric_values[1].value or 0),
        "page_views": int(r.metric_values[2].value or 0),
        "engagement_rate": float(r.metric_values[3].value or 0.0),
    }


def fetch_top_pages(client, prop: str, start: date, end: date, limit: int = 5):
    from google.analytics.data_v1beta.types import (
        Dimension, Metric, OrderBy, RunReportRequest,
    )
    resp = client.run_report(
        RunReportRequest(
            property=prop,
            date_ranges=[_date_range(start, end)],
            dimensions=[Dimension(name="pagePath")],
            metrics=[Metric(name="screenPageViews"), Metric(name="totalUsers")],
            order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="screenPageViews"), desc=True)],
            limit=limit,
        )
    )
    return [
        {
            "path": r.dimension_values[0].value,
            "views": int(r.metric_values[0].value or 0),
            "users": int(r.metric_values[1].value or 0),
        }
        for r in resp.rows
    ]


def fetch_top_sources(client, prop: str, start: date, end: date, limit: int = 5):
    from google.analytics.data_v1beta.types import (
        Dimension, Metric, OrderBy, RunReportRequest,
    )
    resp = client.run_report(
        RunReportRequest(
            property=prop,
            date_ranges=[_date_range(start, end)],
            dimensions=[Dimension(name="sessionSource"), Dimension(name="sessionMedium")],
            metrics=[Metric(name="totalUsers"), Metric(name="sessions")],
            order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="totalUsers"), desc=True)],
            limit=limit,
        )
    )
    return [
        {
            "source": r.dimension_values[0].value,
            "medium": r.dimension_values[1].value,
            "users": int(r.metric_values[0].value or 0),
            "sessions": int(r.metric_values[1].value or 0),
        }
        for r in resp.rows
    ]


def fetch_event_counts(client, prop: str, start: date, end: date, events: list[str]) -> dict:
    from google.analytics.data_v1beta.types import (
        Dimension, Filter, FilterExpression, Metric, RunReportRequest,
    )
    in_list = Filter.InListFilter(values=events, case_sensitive=False)
    resp = client.run_report(
        RunReportRequest(
            property=prop,
            date_ranges=[_date_range(start, end)],
            dimensions=[Dimension(name="eventName")],
            metrics=[Metric(name="eventCount")],
            dimension_filter=FilterExpression(
                filter=Filter(field_name="eventName", in_list_filter=in_list)
            ),
        )
    )
    counts = {e: 0 for e in events}
    for r in resp.rows:
        counts[r.dimension_values[0].value] = int(r.metric_values[0].value or 0)
    return counts


def fetch_daily_users(client, prop: str, start: date, end: date):
    from google.analytics.data_v1beta.types import (
        Dimension, Metric, RunReportRequest,
    )
    resp = client.run_report(
        RunReportRequest(
            property=prop,
            date_ranges=[_date_range(start, end)],
            dimensions=[Dimension(name="date")],
            metrics=[Metric(name="totalUsers")],
        )
    )
    return [
        {
            "date": r.dimension_values[0].value,  # YYYYMMDD
            "users": int(r.metric_values[0].value or 0),
        }
        for r in resp.rows
    ]


# ---------- formatting helpers ----------


def pct_change(current: float, previous: float) -> str:
    if previous == 0 and current == 0:
        return "0%"
    if previous == 0:
        return "new"
    delta = (current - previous) / previous * 100
    sign = "+" if delta >= 0 else ""
    return f"{sign}{delta:.1f}%"


def pct(num: int, den: int) -> str:
    if den == 0:
        return "—"
    return f"{(num / den * 100):.1f}%"


def fmt_ymd(ymd: str) -> str:
    if len(ymd) == 8:
        return f"{ymd[:4]}-{ymd[4:6]}-{ymd[6:8]}"
    return ymd


# ---------- report builder ----------


def build_report() -> tuple[str, Path]:
    today = date.today()
    monday = week_monday(today)

    # Last 7 days window (inclusive): today-6 .. today
    cur_end = today
    cur_start = today - timedelta(days=6)
    # Previous 7 days window: today-13 .. today-7
    prev_end = today - timedelta(days=7)
    prev_start = today - timedelta(days=13)

    property_id = resolve_property_id(None)
    client = _load_client()
    prop = f"properties/{property_id}"

    # Queries
    cur_totals = fetch_totals(client, prop, cur_start, cur_end)
    prev_totals = fetch_totals(client, prop, prev_start, prev_end)
    pages = fetch_top_pages(client, prop, cur_start, cur_end)
    sources = fetch_top_sources(client, prop, cur_start, cur_end)
    events = fetch_event_counts(
        client, prop, cur_start, cur_end,
        ["quiz_start", "quiz_complete", "email_signup", "trainerize_click"],
    )
    daily = fetch_daily_users(client, prop, cur_start, cur_end)

    # Highlights
    highlights = []
    if daily:
        best = max(daily, key=lambda d: d["users"])
        if best["users"] > 0:
            highlights.append(
                f"Biggest traffic day: **{fmt_ymd(best['date'])}** with {best['users']} users"
            )
    if sources:
        top = sources[0]
        if top["users"] > 0:
            highlights.append(
                f"Top source: **{top['source']} / {top['medium']}** ({top['users']} users, {top['sessions']} sessions)"
            )
    if pages:
        p = pages[0]
        if p["views"] > 0:
            highlights.append(
                f"Most-viewed page: **{p['path']}** ({p['views']} views)"
            )
    if not highlights:
        highlights.append("No data yet for this week (new GA4 property).")

    # Build markdown
    lines: list[str] = []
    lines.append(f"# Weekly KPI Report — Week of {date_str(monday)}")
    lines.append("")
    lines.append(
        f"_Generated {date_str(today)} · Current window: {date_str(cur_start)} → {date_str(cur_end)} "
        f"· Previous window: {date_str(prev_start)} → {date_str(prev_end)}_"
    )
    lines.append("")

    # Traffic summary
    lines.append("## Traffic Summary")
    lines.append("")
    lines.append("| Metric | Last 7 days | Previous 7 days | Change |")
    lines.append("|---|---:|---:|---:|")
    lines.append(
        f"| Users | {cur_totals['users']} | {prev_totals['users']} | "
        f"{pct_change(cur_totals['users'], prev_totals['users'])} |"
    )
    lines.append(
        f"| Sessions | {cur_totals['sessions']} | {prev_totals['sessions']} | "
        f"{pct_change(cur_totals['sessions'], prev_totals['sessions'])} |"
    )
    lines.append(
        f"| Page views | {cur_totals['page_views']} | {prev_totals['page_views']} | "
        f"{pct_change(cur_totals['page_views'], prev_totals['page_views'])} |"
    )
    lines.append(
        f"| Engagement rate | {cur_totals['engagement_rate']*100:.1f}% | "
        f"{prev_totals['engagement_rate']*100:.1f}% | "
        f"{pct_change(cur_totals['engagement_rate'], prev_totals['engagement_rate'])} |"
    )
    lines.append("")

    # Top pages
    lines.append("## Top 5 Pages")
    lines.append("")
    if pages:
        lines.append("| Path | Views | Users |")
        lines.append("|---|---:|---:|")
        for p in pages:
            lines.append(f"| {p['path']} | {p['views']} | {p['users']} |")
    else:
        lines.append("_No data._")
    lines.append("")

    # Top sources
    lines.append("## Top 5 Traffic Sources")
    lines.append("")
    if sources:
        lines.append("| Source | Medium | Users | Sessions |")
        lines.append("|---|---|---:|---:|")
        for s in sources:
            lines.append(
                f"| {s['source']} | {s['medium']} | {s['users']} | {s['sessions']} |"
            )
    else:
        lines.append("_No data._")
    lines.append("")

    # Custom events
    lines.append("## Custom Events")
    lines.append("")
    lines.append("| Event | Count |")
    lines.append("|---|---:|")
    for e in ["quiz_start", "quiz_complete", "email_signup", "trainerize_click"]:
        lines.append(f"| {e} | {events.get(e, 0)} |")
    lines.append("")

    # Quiz funnel
    lines.append("## Quiz Funnel")
    lines.append("")
    qs = events.get("quiz_start", 0)
    qc = events.get("quiz_complete", 0)
    es = events.get("email_signup", 0)
    lines.append("| Step | Count | % of start | Drop from previous |")
    lines.append("|---|---:|---:|---:|")
    lines.append(f"| quiz_start | {qs} | 100.0% | — |")
    drop_sc = f"-{pct(qs - qc, qs)}" if qs else "—"
    lines.append(f"| quiz_complete | {qc} | {pct(qc, qs)} | {drop_sc} |")
    drop_ce = f"-{pct(qc - es, qc)}" if qc else "—"
    lines.append(f"| email_signup | {es} | {pct(es, qs)} | {drop_ce} |")
    lines.append("")

    # Highlights
    lines.append("## Highlights")
    lines.append("")
    for h in highlights:
        lines.append(f"- {h}")
    lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("_Run weekly: `python3 tools/ga4_weekly_report.py`_")
    lines.append("")

    report = "\n".join(lines)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / f"weekly-kpi-report-{date_str(today)}.md"
    out_path.write_text(report)

    return report, out_path


def main() -> None:
    report, path = build_report()
    print(report)
    print(f"\n[wrote {path}]", file=sys.stderr)


if __name__ == "__main__":
    main()
