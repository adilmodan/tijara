"""
refresh_quarterly.py — Re-screen stale tickers after earnings reports.

Queries the stock_screenings table for tickers that haven't been screened
recently, re-screens them with fresh yfinance data, and invalidates their
hot cache entries so the web app picks up the new data.

Usage:
    # Re-screen tickers older than 90 days (default)
    uv run python refresh_quarterly.py

    # Custom stale threshold (e.g., after a specific earnings season)
    uv run python refresh_quarterly.py --stale-days 45

    # Re-screen everything
    uv run python refresh_quarterly.py --full

    # Adjust sleep between tickers
    uv run python refresh_quarterly.py --sleep 0.3

Setup:
    export SUPABASE_URL=https://qufoufnfvobdikithrrc.supabase.co
    export SUPABASE_KEY=<your-service-role-key>
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
import time
from datetime import datetime, timezone, timedelta

from supabase import create_client, Client

# Import the screening logic from the batch script
from cache_all_screenings import screen_and_store

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ─── Config ──────────────────────────────────────────────────────────

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    log.error("Set SUPABASE_URL and SUPABASE_KEY environment variables")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ─── Ticker Queries ──────────────────────────────────────────────────

def get_stale_tickers(stale_days: int) -> list[dict]:
    """Fetch tickers from stock_screenings where screened_at is older than stale_days."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=stale_days)).isoformat()
    results: list[dict] = []
    offset = 0
    page_size = 1000

    while True:
        batch = (
            supabase.table("stock_screenings")
            .select("ticker, company_name, cik")
            .lt("screened_at", cutoff)
            .range(offset, offset + page_size - 1)
            .execute()
        )
        if not batch.data:
            break
        results.extend(batch.data)
        if len(batch.data) < page_size:
            break
        offset += page_size

    return results


def get_all_tickers() -> list[dict]:
    """Fetch every ticker from stock_screenings."""
    results: list[dict] = []
    offset = 0
    page_size = 1000

    while True:
        batch = (
            supabase.table("stock_screenings")
            .select("ticker, company_name, cik")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        if not batch.data:
            break
        results.extend(batch.data)
        if len(batch.data) < page_size:
            break
        offset += page_size

    return results


# ─── Hot Cache Invalidation ──────────────────────────────────────────

def invalidate_hot_cache(ticker: str) -> None:
    """Delete a ticker's screening_cache entry so the API rebuilds from fresh DB data."""
    try:
        supabase.table("screening_cache").delete().eq("ticker", ticker).execute()
    except Exception:
        pass  # Non-critical — cache will expire naturally within 24h


# ─── Main ────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Re-screen stale tickers after earnings reports.",
    )
    parser.add_argument(
        "--stale-days", type=int, default=90,
        help="Re-screen tickers older than this many days (default: 90)",
    )
    parser.add_argument(
        "--full", action="store_true",
        help="Re-screen every ticker regardless of age",
    )
    parser.add_argument(
        "--sleep", type=float, default=0.5,
        help="Seconds to sleep between tickers (default: 0.5)",
    )
    args = parser.parse_args()

    log.info("=" * 60)
    log.info("Tijara Quarterly Refresh")
    log.info("=" * 60)

    if args.full:
        log.info("Mode: FULL — re-screening all tickers")
        tickers = get_all_tickers()
    else:
        log.info("Mode: STALE — re-screening tickers older than %d days", args.stale_days)
        tickers = get_stale_tickers(args.stale_days)

    log.info("Tickers to refresh: %d", len(tickers))
    log.info("Est. time: ~%.0f minutes", len(tickers) * args.sleep / 60)
    log.info("-" * 60)

    if not tickers:
        log.info("Nothing to do — all tickers are up to date.")
        return

    counts = {"compliant": 0, "non_compliant": 0, "error": 0}
    start = time.time()

    for i, ticker_info in enumerate(tickers, 1):
        ticker = ticker_info["ticker"]

        try:
            status = screen_and_store(ticker_info)
            invalidate_hot_cache(ticker)
        except Exception as exc:
            log.error("[%d/%d] %s → FATAL ERROR: %s", i, len(tickers), ticker, exc)
            counts["error"] += 1
            time.sleep(args.sleep)
            continue

        counts[status] += 1

        elapsed = time.time() - start
        rate = i / elapsed if elapsed > 0 else 0
        eta_min = (len(tickers) - i) / rate / 60 if rate > 0 else 0

        if i % 50 == 0 or i == len(tickers) or i <= 5:
            log.info(
                "[%d/%d] %s → %s  |  %.1f/s  ETA %.0fm  |  C:%d  NC:%d  E:%d",
                i, len(tickers), ticker, status.upper(),
                rate, eta_min,
                counts["compliant"], counts["non_compliant"], counts["error"],
            )

        time.sleep(args.sleep)

    elapsed_total = (time.time() - start) / 60
    log.info("=" * 60)
    log.info("REFRESH COMPLETE in %.1f minutes", elapsed_total)
    log.info("Compliant:     %d", counts["compliant"])
    log.info("Non-compliant: %d", counts["non_compliant"])
    log.info("Errors:        %d", counts["error"])
    log.info("=" * 60)


if __name__ == "__main__":
    main()
