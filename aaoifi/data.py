"""
Data Fetcher: Financial Data Acquisition Layer

Provides financial data from free sources for the screening pipeline.

Data sources:
    - yfinance: Balance sheet, income statement, market cap, sector/industry
      classification for publicly traded equities.
    - Gold price API: Current spot price of gold per gram for Zakah Nisab
      computation (metals.dev free tier).

Architecture note:
    This module is the only external I/O boundary in the engine. All other
    modules operate on pure data models. When migrating to a brokerage API,
    only this module needs to change — the screening logic remains untouched.
"""

from __future__ import annotations

import logging

import requests
import yfinance as yf

from aaoifi.models import CompanyFinancials

logger = logging.getLogger(__name__)


def fetch_financials(ticker: str) -> CompanyFinancials:
    """Fetch company financial data from Yahoo Finance.

    Extracts the most recent annual balance sheet and income statement data
    needed for AAOIFI screening. Fields that cannot be resolved from public
    data (e.g., interest_bearing_deposits, prohibited_income) default to 0
    and should be supplemented by the caller if available.

    Args:
        ticker: Stock ticker symbol (e.g., "AAPL", "MSFT").

    Returns:
        CompanyFinancials populated with available data. Fields not available
        from yfinance default to 0.0.

    Raises:
        ValueError: If the ticker cannot be resolved or has no financial data.
    """
    stock = yf.Ticker(ticker)
    info = stock.info

    if not info or info.get("regularMarketPrice") is None:
        raise ValueError(f"Cannot resolve ticker '{ticker}' — no market data found")

    # Balance sheet: use most recent annual filing
    bs = stock.balance_sheet
    if bs is not None and not bs.empty:
        latest_bs = bs.iloc[:, 0]  # Most recent period
        total_debt = _safe_get(latest_bs, "Total Debt")
        cash = _safe_get(latest_bs, "Cash And Cash Equivalents")
        receivables = _safe_get(latest_bs, "Receivables")
        total_assets = _safe_get(latest_bs, "Total Assets")

        # Interest-bearing deposits: proxy via short + long term investments
        # (same approach as the web app's Yahoo Finance timeseries mapping)
        interest_bearing_deposits = (
            _safe_get(latest_bs, "Other Short Term Investments")
            + _safe_get(latest_bs, "Long Term Investments")
            + _safe_get(latest_bs, "Investments And Advances")
        )
    else:
        total_debt = cash = receivables = total_assets = 0.0
        interest_bearing_deposits = 0.0
        logger.warning("No balance sheet data for %s", ticker)

    # Income statement: use most recent annual filing
    inc = stock.income_stmt
    total_income = 0.0
    prohibited_income = 0.0
    if inc is not None and not inc.empty:
        latest_inc = inc.iloc[:, 0]
        total_income = _safe_get(latest_inc, "Total Revenue")

        # Prohibited income: interest income earned by the company
        # Fallback chain matching the web app's approach
        prohibited_income = _safe_get(latest_inc, "Interest Income")
        if prohibited_income == 0.0:
            prohibited_income = _safe_get(latest_inc, "Interest Income Non Operating")
        if prohibited_income == 0.0:
            net_interest = _safe_get(latest_inc, "Net Interest Income")
            interest_expense = abs(_safe_get(latest_inc, "Interest Expense"))
            if net_interest != 0.0 or interest_expense != 0.0:
                prohibited_income = net_interest + interest_expense
        if prohibited_income == 0.0:
            prohibited_income = _safe_get(latest_inc, "Net Non Operating Interest Income Expense")
        # Clamp to >= 0 (negative interest income is not meaningful here)
        prohibited_income = max(0.0, prohibited_income)

    return CompanyFinancials(
        ticker=ticker,
        sector=info.get("sector", ""),
        industry=info.get("industry", ""),
        market_cap=info.get("marketCap", 0.0),
        total_debt=total_debt,
        interest_bearing_deposits=interest_bearing_deposits,
        prohibited_income=prohibited_income,
        total_income=total_income,
        cash=cash,
        receivables=receivables,
        total_assets=total_assets,
    )


def fetch_gold_price_per_gram() -> float:
    """Fetch the current gold spot price per gram in USD.

    Uses the metals.dev free API. Falls back to a conservative estimate
    if the API is unreachable.

    Returns:
        Gold price per gram in USD.
    """
    try:
        resp = requests.get(
            "https://api.metals.dev/v1/latest",
            params={"api_key": "demo", "currency": "USD", "unit": "gram"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        gold_price = data.get("metals", {}).get("gold", None)
        if gold_price is not None:
            return float(gold_price)
    except (requests.RequestException, ValueError, KeyError) as exc:
        logger.warning("Gold price API unavailable: %s. Using fallback.", exc)

    # Fallback: conservative estimate (~$90/gram as of early 2026)
    # Caller should provide their own price for production use
    return 90.0


def _safe_get(series, key: str, default: float = 0.0) -> float:
    """Safely extract a numeric value from a pandas Series."""
    try:
        val = series.get(key, default)
        if val is None:
            return default
        return float(val)
    except (TypeError, ValueError):
        return default
