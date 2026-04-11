#!/usr/bin/env python3
"""
GA4 Data API reporter for lauratreto.com.

Commands:
    summary  --days N      Users, sessions, page views, top 5 pages, top 5 sources.
    funnel quiz --days N   quiz_start -> quiz_complete -> email_signup with drop-off.
    sources  --days N      Traffic by source/medium with users and sessions.
    events   --days N      All custom events with counts.
    realtime               Active users right now + recent events.

Auth:
    Service account JSON at .credentials/ga4-service-account.json (relative to project root).

Property ID resolution order:
    1. --property-id CLI flag
    2. GA4_PROPERTY_ID env var
    3. tools/ga4_config.json  { "property_id": "123456789" }

Run `python tools/ga4_report.py --help` without credentials for CLI discovery.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Optional

# Project layout
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
CREDENTIALS_PATH = PROJECT_ROOT / ".credentials" / "ga4-service-account.json"
CONFIG_PATH = SCRIPT_DIR / "ga4_config.json"

# Known stream info (for reference / realtime filtering if needed)
MEASUREMENT_ID = "G-D8L9H56MED"
STREAM_ID = "14347946382"


# ---------- helpers ----------


def _err(msg: str, code: int = 1) -> None:
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(code)


def resolve_property_id(cli_value: Optional[str]) -> str:
    if cli_value:
        return cli_value.strip()
    env_val = os.environ.get("GA4_PROPERTY_ID")
    if env_val:
        return env_val.strip()
    if CONFIG_PATH.exists():
        try:
            data = json.loads(CONFIG_PATH.read_text())
            if data.get("property_id"):
                return str(data["property_id"]).strip()
        except Exception as e:
            _err(f"failed to read {CONFIG_PATH}: {e}")
    _err(
        "GA4 numeric Property ID not set. Provide one of:\n"
        "  --property-id 123456789\n"
        "  export GA4_PROPERTY_ID=123456789\n"
        "  tools/ga4_config.json  -> {\"property_id\": \"123456789\"}\n"
        "Find it in GA4: Admin -> Property Settings -> Property ID."
    )
    return ""  # unreachable


def _load_client():
    """Lazy-import so --help works without the library or credentials."""
    if not CREDENTIALS_PATH.exists():
        _err(
            f"Drop the service account JSON at .credentials/ga4-service-account.json "
            f"— see tools/README-ga4.md for setup"
        )
    try:
        from google.analytics.data_v1beta import BetaAnalyticsDataClient
        from google.oauth2 import service_account
    except ImportError:
        _err(
            "google-analytics-data not installed. Run:\n"
            "  pip install -r tools/requirements.txt"
        )
    creds = service_account.Credentials.from_service_account_file(
        str(CREDENTIALS_PATH),
        scopes=["https://www.googleapis.com/auth/analytics.readonly"],
    )
    return BetaAnalyticsDataClient(credentials=creds)


def _print_table(title: str, headers: list[str], rows: list[list[str]]) -> None:
    try:
        from rich.console import Console
        from rich.table import Table

        table = Table(title=title, show_lines=False)
        for h in headers:
            table.add_column(h, overflow="fold")
        for r in rows:
            table.add_row(*[str(x) for x in r])
        Console().print(table)
        return
    except ImportError:
        pass

    # Plain-text fallback
    print(f"\n=== {title} ===")
    widths = [max(len(str(h)), *(len(str(r[i])) for r in rows)) if rows else len(h)
              for i, h in enumerate(headers)]
    line = "  ".join(h.ljust(widths[i]) for i, h in enumerate(headers))
    print(line)
    print("-" * len(line))
    for r in rows:
        print("  ".join(str(r[i]).ljust(widths[i]) for i in range(len(headers))))


def _date_range(days: int):
    from google.analytics.data_v1beta.types import DateRange
    return DateRange(start_date=f"{days}daysAgo", end_date="today")


# ---------- commands ----------


def cmd_summary(property_id: str, days: int) -> None:
    from google.analytics.data_v1beta.types import (
        Dimension,
        Metric,
        RunReportRequest,
        OrderBy,
    )

    client = _load_client()
    prop = f"properties/{property_id}"

    # Totals
    totals = client.run_report(
        RunReportRequest(
            property=prop,
            date_ranges=[_date_range(days)],
            metrics=[
                Metric(name="totalUsers"),
                Metric(name="sessions"),
                Metric(name="screenPageViews"),
                Metric(name="engagementRate"),
            ],
        )
    )
    if totals.rows:
        r = totals.rows[0]
        rows = [
            ["Users", r.metric_values[0].value],
            ["Sessions", r.metric_values[1].value],
            ["Page Views", r.metric_values[2].value],
            ["Engagement Rate", f"{float(r.metric_values[3].value)*100:.1f}%"],
        ]
    else:
        rows = [["(no data)", ""]]
    _print_table(f"Summary — last {days} days", ["Metric", "Value"], rows)

    # Top 5 pages
    pages = client.run_report(
        RunReportRequest(
            property=prop,
            date_ranges=[_date_range(days)],
            dimensions=[Dimension(name="pagePath")],
            metrics=[Metric(name="screenPageViews"), Metric(name="totalUsers")],
            order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="screenPageViews"), desc=True)],
            limit=5,
        )
    )
    rows = [[r.dimension_values[0].value, r.metric_values[0].value, r.metric_values[1].value]
            for r in pages.rows]
    _print_table("Top 5 Pages", ["Path", "Views", "Users"], rows or [["(no data)", "", ""]])

    # Top 5 sources
    sources = client.run_report(
        RunReportRequest(
            property=prop,
            date_ranges=[_date_range(days)],
            dimensions=[Dimension(name="sessionSource"), Dimension(name="sessionMedium")],
            metrics=[Metric(name="totalUsers"), Metric(name="sessions")],
            order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="totalUsers"), desc=True)],
            limit=5,
        )
    )
    rows = [[r.dimension_values[0].value, r.dimension_values[1].value,
             r.metric_values[0].value, r.metric_values[1].value] for r in sources.rows]
    _print_table("Top 5 Sources", ["Source", "Medium", "Users", "Sessions"],
                 rows or [["(no data)", "", "", ""]])


def cmd_funnel_quiz(property_id: str, days: int) -> None:
    from google.analytics.data_v1beta.types import (
        Dimension,
        Metric,
        RunReportRequest,
        Filter,
        FilterExpression,
        FilterExpressionList,
    )

    client = _load_client()
    prop = f"properties/{property_id}"

    events = ["quiz_start", "quiz_complete", "email_signup"]
    in_list = Filter.InListFilter(values=events, case_sensitive=False)
    req = RunReportRequest(
        property=prop,
        date_ranges=[_date_range(days)],
        dimensions=[Dimension(name="eventName")],
        metrics=[Metric(name="eventCount")],
        dimension_filter=FilterExpression(
            filter=Filter(field_name="eventName", in_list_filter=in_list)
        ),
    )
    resp = client.run_report(req)
    counts = {e: 0 for e in events}
    for r in resp.rows:
        counts[r.dimension_values[0].value] = int(r.metric_values[0].value)

    start = counts["quiz_start"]
    complete = counts["quiz_complete"]
    signup = counts["email_signup"]

    def pct(num, den):
        return f"{(num/den*100):.1f}%" if den else "—"

    rows = [
        ["quiz_start", start, "100.0%", "—"],
        ["quiz_complete", complete, pct(complete, start),
         f"-{pct(start-complete, start)}" if start else "—"],
        ["email_signup", signup, pct(signup, start),
         f"-{pct(complete-signup, complete)}" if complete else "—"],
    ]
    _print_table(
        f"Quiz Funnel — last {days} days",
        ["Step", "Count", "% of start", "Drop from prev"],
        rows,
    )


def cmd_sources(property_id: str, days: int) -> None:
    from google.analytics.data_v1beta.types import (
        Dimension,
        Metric,
        RunReportRequest,
        OrderBy,
    )

    client = _load_client()
    prop = f"properties/{property_id}"
    resp = client.run_report(
        RunReportRequest(
            property=prop,
            date_ranges=[_date_range(days)],
            dimensions=[Dimension(name="sessionSource"), Dimension(name="sessionMedium")],
            metrics=[Metric(name="totalUsers"), Metric(name="sessions"),
                     Metric(name="engagementRate")],
            order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="sessions"), desc=True)],
            limit=50,
        )
    )
    rows = [
        [r.dimension_values[0].value, r.dimension_values[1].value,
         r.metric_values[0].value, r.metric_values[1].value,
         f"{float(r.metric_values[2].value)*100:.1f}%"]
        for r in resp.rows
    ]
    _print_table(
        f"Traffic Sources — last {days} days",
        ["Source", "Medium", "Users", "Sessions", "Engagement"],
        rows or [["(no data)", "", "", "", ""]],
    )


def cmd_events(property_id: str, days: int) -> None:
    from google.analytics.data_v1beta.types import (
        Dimension,
        Metric,
        RunReportRequest,
        OrderBy,
    )

    client = _load_client()
    prop = f"properties/{property_id}"
    resp = client.run_report(
        RunReportRequest(
            property=prop,
            date_ranges=[_date_range(days)],
            dimensions=[Dimension(name="eventName")],
            metrics=[Metric(name="eventCount"), Metric(name="totalUsers")],
            order_bys=[OrderBy(metric=OrderBy.MetricOrderBy(metric_name="eventCount"), desc=True)],
            limit=100,
        )
    )
    highlight = {"quiz_start", "quiz_complete", "email_signup", "trainerize_click"}
    rows = []
    for r in resp.rows:
        name = r.dimension_values[0].value
        marker = "*" if name in highlight else ""
        rows.append([f"{marker}{name}", r.metric_values[0].value, r.metric_values[1].value])
    _print_table(
        f"Events — last {days} days (* = tracked)",
        ["Event", "Count", "Users"],
        rows or [["(no data)", "", ""]],
    )


def cmd_realtime(property_id: str) -> None:
    from google.analytics.data_v1beta.types import (
        Dimension,
        Metric,
        RunRealtimeReportRequest,
    )

    client = _load_client()
    prop = f"properties/{property_id}"

    # Active users now
    totals = client.run_realtime_report(
        RunRealtimeReportRequest(
            property=prop,
            metrics=[Metric(name="activeUsers")],
        )
    )
    active = totals.rows[0].metric_values[0].value if totals.rows else "0"
    _print_table("Realtime — Active Users", ["Metric", "Value"], [["Active users (now)", active]])

    # Recent events (last 30 min)
    events = client.run_realtime_report(
        RunRealtimeReportRequest(
            property=prop,
            dimensions=[Dimension(name="eventName")],
            metrics=[Metric(name="eventCount")],
            limit=25,
        )
    )
    rows = [[r.dimension_values[0].value, r.metric_values[0].value] for r in events.rows]
    _print_table("Realtime — Events (last 30 min)", ["Event", "Count"],
                 rows or [["(no data)", ""]])


# ---------- CLI ----------


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="ga4_report.py",
        description="GA4 Data API reporter for lauratreto.com",
    )
    p.add_argument("--property-id", help="GA4 numeric Property ID (overrides env/config)")
    sub = p.add_subparsers(dest="command", required=True)

    s = sub.add_parser("summary", help="Users, sessions, page views, top pages/sources")
    s.add_argument("--days", type=int, default=7)

    f = sub.add_parser("funnel", help="Funnel reports")
    f_sub = f.add_subparsers(dest="funnel_name", required=True)
    fq = f_sub.add_parser("quiz", help="quiz_start -> quiz_complete -> email_signup")
    fq.add_argument("--days", type=int, default=7)

    src = sub.add_parser("sources", help="Traffic by source/medium")
    src.add_argument("--days", type=int, default=30)

    ev = sub.add_parser("events", help="Custom event counts")
    ev.add_argument("--days", type=int, default=7)

    sub.add_parser("realtime", help="Active users + recent events (last 30 min)")
    return p


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    property_id = resolve_property_id(args.property_id)

    if args.command == "summary":
        cmd_summary(property_id, args.days)
    elif args.command == "funnel" and args.funnel_name == "quiz":
        cmd_funnel_quiz(property_id, args.days)
    elif args.command == "sources":
        cmd_sources(property_id, args.days)
    elif args.command == "events":
        cmd_events(property_id, args.days)
    elif args.command == "realtime":
        cmd_realtime(property_id)
    else:
        parser.print_help()
        sys.exit(2)


if __name__ == "__main__":
    main()
