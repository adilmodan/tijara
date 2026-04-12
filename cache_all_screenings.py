"""
cache_all_screenings.py — Pre-screen all US public equities and store in Supabase.

Fetches tickers from SEC EDGAR, screens each through the AAOIFI pipeline,
and upserts full results + all yfinance fields into individual Supabase columns.

Designed to run unattended. Handles all errors gracefully, logs progress,
and can be resumed after interruption (skips recently screened tickers).

Setup:
    1. Run migrations/001_stock_screenings.sql in your Supabase SQL Editor.
    2. Install deps:  uv add supabase
    3. Run:
       export SUPABASE_URL=https://qufoufnfvobdikithrrc.supabase.co
       export SUPABASE_KEY=<your-service-role-key>
       uv run python cache_all_screenings.py
"""

from __future__ import annotations

import json
import logging
import math
import os
import re
import sys
import time
from datetime import datetime, timezone, timedelta

import requests
import yfinance as yf
from supabase import create_client, Client

from aaoifi import screen_stock
from aaoifi.models import ComplianceStatus

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ─── Config ──────────────────────────────────────────────────────────

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
SLEEP_BETWEEN = 0.5
STALE_DAYS = 30
BATCH_LOG_EVERY = 50  # log summary every N tickers

if not SUPABASE_URL or not SUPABASE_KEY:
    log.error("Set SUPABASE_URL and SUPABASE_KEY environment variables")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ─── JSON Sanitization ──────────────────────────────────────────────

def sanitize_for_json(obj: object) -> object:
    """Recursively convert an object to JSON-safe types.
    Handles NaN, Inf, pandas Timestamps, numpy types, etc."""
    if obj is None:
        return None
    if isinstance(obj, (bool,)):
        return obj
    if isinstance(obj, (int,)):
        return obj
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if isinstance(obj, str):
        return obj
    if isinstance(obj, dict):
        return {str(k): sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [sanitize_for_json(v) for v in obj]
    # pandas Timestamp
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    # numpy numeric types
    if hasattr(obj, 'item'):
        try:
            val = obj.item()
            if isinstance(val, float) and (math.isnan(val) or math.isinf(val)):
                return None
            return val
        except (ValueError, TypeError):
            return str(obj)
    return str(obj)


def dataframe_to_dict(df) -> dict | None:
    """Convert a pandas DataFrame to a JSON-safe nested dict.
    Columns become keys, each mapping to {row_label: value}."""
    if df is None or df.empty:
        return None
    result = {}
    for col in df.columns:
        col_key = col.isoformat() if hasattr(col, 'isoformat') else str(col)
        result[col_key] = {}
        for idx in df.index:
            idx_key = str(idx)
            val = df.at[idx, col]
            result[col_key][idx_key] = sanitize_for_json(val)
    return result


def safe_number(val) -> float | None:
    """Return None for NaN/Inf/non-numeric, pass through valid numbers."""
    if val is None:
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    except (TypeError, ValueError):
        return None


def safe_int(val) -> int | None:
    """Return None for non-integer-like values."""
    if val is None:
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        return int(f)
    except (TypeError, ValueError):
        return None


def safe_str(val) -> str | None:
    """Return None for empty/None, else str."""
    if val is None:
        return None
    s = str(val)
    return s if s else None


def safe_bool(val) -> bool | None:
    """Return None for non-bool."""
    if val is None:
        return None
    if isinstance(val, bool):
        return val
    return None


def _safe_get(series, key: str, default=None):
    """Safely extract a value from a pandas Series."""
    try:
        val = series.get(key, default)
        if val is None:
            return default
        return val
    except (TypeError, ValueError):
        return default


# ─── Ticker Fetching ─────────────────────────────────────────────────

SKIP_PATTERN = re.compile(r"[-/]")
DIGIT_RE = re.compile(r"\d")


def fetch_tickers() -> list[dict]:
    """Fetch all US tickers from SEC EDGAR, filtered to common stock."""
    log.info("Fetching tickers from SEC EDGAR...")
    resp = requests.get(
        "https://www.sec.gov/files/company_tickers.json",
        headers={"User-Agent": "tijara-cache admin@example.com"},
        timeout=30,
    )
    resp.raise_for_status()
    raw = resp.json()

    tickers = []
    seen: set[str] = set()
    for entry in raw.values():
        symbol = entry.get("ticker", "").strip().upper()
        if not symbol or symbol in seen:
            continue
        if SKIP_PATTERN.search(symbol):
            continue
        if len(symbol) > 5:
            continue
        if len(symbol) > 4 and DIGIT_RE.search(symbol):
            continue

        seen.add(symbol)
        tickers.append({
            "ticker": symbol,
            "company_name": entry.get("title", ""),
            "cik": str(entry.get("cik_str", "")),
        })

    log.info("Found %d tickers after filtering", len(tickers))
    return tickers


# ─── Supabase Helpers ────────────────────────────────────────────────

def get_complete_tickers() -> set[str]:
    """Get tickers that have COMPLETE data (screened within STALE_DAYS, no missing fields).
    Tickers with missing deposit_ratio/income_ratio or error status
    will NOT be in this set, so they get re-screened."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=STALE_DAYS)).isoformat()

    complete: set[str] = set()
    offset = 0
    page_size = 1000

    while True:
        result = (
            supabase.table("stock_screenings")
            .select("ticker, status, deposit_ratio, income_ratio")
            .gte("screened_at", cutoff)
            .neq("status", "error")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        if not result.data:
            break
        for row in result.data:
            if row.get("deposit_ratio") is not None or row.get("income_ratio") is not None:
                complete.add(row["ticker"])
        if len(result.data) < page_size:
            break
        offset += page_size

    return complete


def upsert_result(row: dict) -> None:
    """Upsert a screening result into Supabase, with retry on transient errors."""
    for attempt in range(3):
        try:
            supabase.table("stock_screenings").upsert(
                row, on_conflict="ticker"
            ).execute()
            return
        except Exception as exc:
            if attempt < 2:
                log.warning("Supabase upsert failed for %s (attempt %d): %s", row.get("ticker"), attempt + 1, exc)
                time.sleep(1 + attempt)
            else:
                log.error("Supabase upsert FAILED for %s after 3 attempts: %s", row.get("ticker"), exc)
                raise


# ─── Extract yfinance .info → individual columns ────────────────────

def extract_info_columns(info: dict) -> dict:
    """Map yfinance .info dict to yf_* columns."""
    if not info:
        return {}

    return {
        "yf_symbol": safe_str(info.get("symbol")),
        "yf_short_name": safe_str(info.get("shortName")),
        "yf_long_name": safe_str(info.get("longName")),
        "yf_exchange": safe_str(info.get("exchange")),
        "yf_full_exchange_name": safe_str(info.get("fullExchangeName")),
        "yf_quote_type": safe_str(info.get("quoteType")),
        "yf_market": safe_str(info.get("market")),
        "yf_market_state": safe_str(info.get("marketState")),
        "yf_currency": safe_str(info.get("currency")),
        "yf_financial_currency": safe_str(info.get("financialCurrency")),
        "yf_language": safe_str(info.get("language")),
        "yf_region": safe_str(info.get("region")),
        "yf_sector": safe_str(info.get("sector")),
        "yf_sector_disp": safe_str(info.get("sectorDisp")),
        "yf_sector_key": safe_str(info.get("sectorKey")),
        "yf_industry": safe_str(info.get("industry")),
        "yf_industry_disp": safe_str(info.get("industryDisp")),
        "yf_industry_key": safe_str(info.get("industryKey")),
        "yf_address1": safe_str(info.get("address1")),
        "yf_city": safe_str(info.get("city")),
        "yf_state": safe_str(info.get("state")),
        "yf_zip": safe_str(info.get("zip")),
        "yf_country": safe_str(info.get("country")),
        "yf_phone": safe_str(info.get("phone")),
        "yf_website": safe_str(info.get("website")),
        "yf_ir_website": safe_str(info.get("irWebsite")),
        "yf_long_business_summary": safe_str(info.get("longBusinessSummary")),
        "yf_full_time_employees": safe_int(info.get("fullTimeEmployees")),
        "yf_company_officers": sanitize_for_json(info.get("companyOfficers")) if info.get("companyOfficers") else None,
        "yf_executive_team": sanitize_for_json(info.get("executiveTeam")) if info.get("executiveTeam") else None,
        "yf_corporate_actions": sanitize_for_json(info.get("corporateActions")) if info.get("corporateActions") else None,
        "yf_market_cap": safe_number(info.get("marketCap")),
        "yf_non_diluted_market_cap": safe_number(info.get("nonDilutedMarketCap")),
        "yf_enterprise_value": safe_number(info.get("enterpriseValue")),
        "yf_shares_outstanding": safe_number(info.get("sharesOutstanding")),
        "yf_float_shares": safe_number(info.get("floatShares")),
        "yf_implied_shares_outstanding": safe_number(info.get("impliedSharesOutstanding")),
        "yf_current_price": safe_number(info.get("currentPrice")),
        "yf_open": safe_number(info.get("open")),
        "yf_day_high": safe_number(info.get("dayHigh")),
        "yf_day_low": safe_number(info.get("dayLow")),
        "yf_previous_close": safe_number(info.get("previousClose")),
        "yf_regular_market_price": safe_number(info.get("regularMarketPrice")),
        "yf_regular_market_change": safe_number(info.get("regularMarketChange")),
        "yf_regular_market_change_percent": safe_number(info.get("regularMarketChangePercent")),
        "yf_regular_market_day_high": safe_number(info.get("regularMarketDayHigh")),
        "yf_regular_market_day_low": safe_number(info.get("regularMarketDayLow")),
        "yf_regular_market_day_range": safe_str(info.get("regularMarketDayRange")),
        "yf_regular_market_open": safe_number(info.get("regularMarketOpen")),
        "yf_regular_market_previous_close": safe_number(info.get("regularMarketPreviousClose")),
        "yf_regular_market_volume": safe_int(info.get("regularMarketVolume")),
        "yf_regular_market_time": safe_int(info.get("regularMarketTime")),
        "yf_post_market_price": safe_number(info.get("postMarketPrice")),
        "yf_post_market_change": safe_number(info.get("postMarketChange")),
        "yf_post_market_change_percent": safe_number(info.get("postMarketChangePercent")),
        "yf_post_market_time": safe_int(info.get("postMarketTime")),
        "yf_bid": safe_number(info.get("bid")),
        "yf_bid_size": safe_int(info.get("bidSize")),
        "yf_ask": safe_number(info.get("ask")),
        "yf_ask_size": safe_int(info.get("askSize")),
        "yf_volume": safe_int(info.get("volume")),
        "yf_average_volume": safe_int(info.get("averageVolume")),
        "yf_average_volume_10days": safe_int(info.get("averageVolume10days")),
        "yf_average_daily_volume_10day": safe_int(info.get("averageDailyVolume10Day")),
        "yf_average_daily_volume_3month": safe_int(info.get("averageDailyVolume3Month")),
        "yf_fifty_two_week_high": safe_number(info.get("fiftyTwoWeekHigh")),
        "yf_fifty_two_week_low": safe_number(info.get("fiftyTwoWeekLow")),
        "yf_fifty_two_week_range": safe_str(info.get("fiftyTwoWeekRange")),
        "yf_fifty_two_week_change_percent": safe_number(info.get("fiftyTwoWeekChangePercent")),
        "yf_fifty_two_week_high_change": safe_number(info.get("fiftyTwoWeekHighChange")),
        "yf_fifty_two_week_high_change_percent": safe_number(info.get("fiftyTwoWeekHighChangePercent")),
        "yf_fifty_two_week_low_change": safe_number(info.get("fiftyTwoWeekLowChange")),
        "yf_fifty_two_week_low_change_percent": safe_number(info.get("fiftyTwoWeekLowChangePercent")),
        "yf_52_week_change": safe_number(info.get("52WeekChange")),
        "yf_sandp_52_week_change": safe_number(info.get("SandP52WeekChange")),
        "yf_all_time_high": safe_number(info.get("allTimeHigh")),
        "yf_all_time_low": safe_number(info.get("allTimeLow")),
        "yf_fifty_day_average": safe_number(info.get("fiftyDayAverage")),
        "yf_fifty_day_average_change": safe_number(info.get("fiftyDayAverageChange")),
        "yf_fifty_day_average_change_percent": safe_number(info.get("fiftyDayAverageChangePercent")),
        "yf_two_hundred_day_average": safe_number(info.get("twoHundredDayAverage")),
        "yf_two_hundred_day_average_change": safe_number(info.get("twoHundredDayAverageChange")),
        "yf_two_hundred_day_average_change_percent": safe_number(info.get("twoHundredDayAverageChangePercent")),
        "yf_beta": safe_number(info.get("beta")),
        "yf_trailing_pe": safe_number(info.get("trailingPE")),
        "yf_forward_pe": safe_number(info.get("forwardPE")),
        "yf_price_to_book": safe_number(info.get("priceToBook")),
        "yf_price_to_sales_trailing_12months": safe_number(info.get("priceToSalesTrailing12Months")),
        "yf_price_eps_current_year": safe_number(info.get("priceEpsCurrentYear")),
        "yf_enterprise_to_revenue": safe_number(info.get("enterpriseToRevenue")),
        "yf_enterprise_to_ebitda": safe_number(info.get("enterpriseToEbitda")),
        "yf_trailing_peg_ratio": safe_number(info.get("trailingPegRatio")),
        "yf_trailing_eps": safe_number(info.get("trailingEps")),
        "yf_forward_eps": safe_number(info.get("forwardEps")),
        "yf_eps_trailing_twelve_months": safe_number(info.get("epsTrailingTwelveMonths")),
        "yf_eps_current_year": safe_number(info.get("epsCurrentYear")),
        "yf_book_value": safe_number(info.get("bookValue")),
        "yf_total_cash": safe_number(info.get("totalCash")),
        "yf_total_cash_per_share": safe_number(info.get("totalCashPerShare")),
        "yf_total_debt": safe_number(info.get("totalDebt")),
        "yf_total_revenue": safe_number(info.get("totalRevenue")),
        "yf_revenue_per_share": safe_number(info.get("revenuePerShare")),
        "yf_revenue_growth": safe_number(info.get("revenueGrowth")),
        "yf_earnings_growth": safe_number(info.get("earningsGrowth")),
        "yf_earnings_quarterly_growth": safe_number(info.get("earningsQuarterlyGrowth")),
        "yf_ebitda": safe_number(info.get("ebitda")),
        "yf_ebitda_margins": safe_number(info.get("ebitdaMargins")),
        "yf_gross_profits": safe_number(info.get("grossProfits")),
        "yf_gross_margins": safe_number(info.get("grossMargins")),
        "yf_operating_margins": safe_number(info.get("operatingMargins")),
        "yf_profit_margins": safe_number(info.get("profitMargins")),
        "yf_operating_cashflow": safe_number(info.get("operatingCashflow")),
        "yf_free_cashflow": safe_number(info.get("freeCashflow")),
        "yf_net_income_to_common": safe_number(info.get("netIncomeToCommon")),
        "yf_return_on_assets": safe_number(info.get("returnOnAssets")),
        "yf_return_on_equity": safe_number(info.get("returnOnEquity")),
        "yf_current_ratio": safe_number(info.get("currentRatio")),
        "yf_quick_ratio": safe_number(info.get("quickRatio")),
        "yf_debt_to_equity": safe_number(info.get("debtToEquity")),
        "yf_payout_ratio": safe_number(info.get("payoutRatio")),
        "yf_dividend_rate": safe_number(info.get("dividendRate")),
        "yf_dividend_yield": safe_number(info.get("dividendYield")),
        "yf_trailing_annual_dividend_rate": safe_number(info.get("trailingAnnualDividendRate")),
        "yf_trailing_annual_dividend_yield": safe_number(info.get("trailingAnnualDividendYield")),
        "yf_five_year_avg_dividend_yield": safe_number(info.get("fiveYearAvgDividendYield")),
        "yf_ex_dividend_date": safe_int(info.get("exDividendDate")),
        "yf_dividend_date": safe_int(info.get("dividendDate")),
        "yf_last_dividend_date": safe_int(info.get("lastDividendDate")),
        "yf_last_dividend_value": safe_number(info.get("lastDividendValue")),
        "yf_last_split_date": safe_int(info.get("lastSplitDate")),
        "yf_last_split_factor": safe_str(info.get("lastSplitFactor")),
        "yf_shares_short": safe_number(info.get("sharesShort")),
        "yf_shares_short_prior_month": safe_number(info.get("sharesShortPriorMonth")),
        "yf_shares_short_previous_month_date": safe_int(info.get("sharesShortPreviousMonthDate")),
        "yf_short_ratio": safe_number(info.get("shortRatio")),
        "yf_short_percent_of_float": safe_number(info.get("shortPercentOfFloat")),
        "yf_date_short_interest": safe_int(info.get("dateShortInterest")),
        "yf_held_percent_insiders": safe_number(info.get("heldPercentInsiders")),
        "yf_held_percent_institutions": safe_number(info.get("heldPercentInstitutions")),
        "yf_number_of_analyst_opinions": safe_int(info.get("numberOfAnalystOpinions")),
        "yf_target_high_price": safe_number(info.get("targetHighPrice")),
        "yf_target_low_price": safe_number(info.get("targetLowPrice")),
        "yf_target_mean_price": safe_number(info.get("targetMeanPrice")),
        "yf_target_median_price": safe_number(info.get("targetMedianPrice")),
        "yf_recommendation_mean": safe_number(info.get("recommendationMean")),
        "yf_recommendation_key": safe_str(info.get("recommendationKey")),
        "yf_average_analyst_rating": safe_str(info.get("averageAnalystRating")),
        "yf_earnings_timestamp": safe_int(info.get("earningsTimestamp")),
        "yf_earnings_timestamp_start": safe_int(info.get("earningsTimestampStart")),
        "yf_earnings_timestamp_end": safe_int(info.get("earningsTimestampEnd")),
        "yf_earnings_call_timestamp_start": safe_int(info.get("earningsCallTimestampStart")),
        "yf_earnings_call_timestamp_end": safe_int(info.get("earningsCallTimestampEnd")),
        "yf_is_earnings_date_estimate": safe_bool(info.get("isEarningsDateEstimate")),
        "yf_most_recent_quarter": safe_int(info.get("mostRecentQuarter")),
        "yf_last_fiscal_year_end": safe_int(info.get("lastFiscalYearEnd")),
        "yf_next_fiscal_year_end": safe_int(info.get("nextFiscalYearEnd")),
        "yf_audit_risk": safe_number(info.get("auditRisk")),
        "yf_board_risk": safe_number(info.get("boardRisk")),
        "yf_compensation_risk": safe_number(info.get("compensationRisk")),
        "yf_share_holder_rights_risk": safe_number(info.get("shareHolderRightsRisk")),
        "yf_overall_risk": safe_number(info.get("overallRisk")),
        "yf_compensation_as_of_epoch_date": safe_int(info.get("compensationAsOfEpochDate")),
        "yf_governance_epoch_date": safe_int(info.get("governanceEpochDate")),
        "yf_esg_populated": safe_bool(info.get("esgPopulated")),
        "yf_max_age": safe_int(info.get("maxAge")),
        "yf_price_hint": safe_int(info.get("priceHint")),
        "yf_first_trade_date_milliseconds": safe_int(info.get("firstTradeDateMilliseconds")),
        "yf_exchange_data_delayed_by": safe_int(info.get("exchangeDataDelayedBy")),
        "yf_exchange_timezone_name": safe_str(info.get("exchangeTimezoneName")),
        "yf_exchange_timezone_short_name": safe_str(info.get("exchangeTimezoneShortName")),
        "yf_gmt_off_set_milliseconds": safe_int(info.get("gmtOffSetMilliseconds")),
        "yf_message_board_id": safe_str(info.get("messageBoardId")),
        "yf_source_interval": safe_int(info.get("sourceInterval")),
        "yf_tradeable": safe_bool(info.get("tradeable")),
        "yf_crypto_tradeable": safe_bool(info.get("cryptoTradeable")),
        "yf_triggerable": safe_bool(info.get("triggerable")),
        "yf_has_pre_post_market_data": safe_bool(info.get("hasPrePostMarketData")),
        "yf_display_name": safe_str(info.get("displayName")),
        "yf_type_disp": safe_str(info.get("typeDisp")),
        "yf_quote_source_name": safe_str(info.get("quoteSourceName")),
        "yf_custom_price_alert_confidence": safe_str(info.get("customPriceAlertConfidence")),
    }


# ─── Extract Balance Sheet → individual columns ─────────────────────

# Map: DB column name → yfinance balance sheet row label
BS_FIELD_MAP = {
    "bs_total_assets": "Total Assets",
    "bs_current_assets": "Current Assets",
    "bs_total_non_current_assets": "Total Non Current Assets",
    "bs_cash_and_cash_equivalents": "Cash And Cash Equivalents",
    "bs_cash_equivalents": "Cash Equivalents",
    "bs_cash_financial": "Cash Financial",
    "bs_cash_cash_equivalents_and_short_term_investments": "Cash Cash Equivalents And Short Term Investments",
    "bs_other_short_term_investments": "Other Short Term Investments",
    "bs_accounts_receivable": "Accounts Receivable",
    "bs_receivables": "Receivables",
    "bs_other_receivables": "Other Receivables",
    "bs_inventory": "Inventory",
    "bs_other_current_assets": "Other Current Assets",
    "bs_available_for_sale_securities": "Available For Sale Securities",
    "bs_investmentin_financial_assets": "Investmentin Financial Assets",
    "bs_investments_and_advances": "Investments And Advances",
    "bs_other_investments": "Other Investments",
    "bs_gross_ppe": "Gross PPE",
    "bs_accumulated_depreciation": "Accumulated Depreciation",
    "bs_net_ppe": "Net PPE",
    "bs_land_and_improvements": "Land And Improvements",
    "bs_machinery_furniture_equipment": "Machinery Furniture Equipment",
    "bs_other_properties": "Other Properties",
    "bs_properties": "Properties",
    "bs_leases": "Leases",
    "bs_non_current_deferred_assets": "Non Current Deferred Assets",
    "bs_non_current_deferred_taxes_assets": "Non Current Deferred Taxes Assets",
    "bs_other_non_current_assets": "Other Non Current Assets",
    "bs_total_liabilities_net_minority_interest": "Total Liabilities Net Minority Interest",
    "bs_current_liabilities": "Current Liabilities",
    "bs_total_non_current_liabilities_net_minority_interest": "Total Non Current Liabilities Net Minority Interest",
    "bs_accounts_payable": "Accounts Payable",
    "bs_payables": "Payables",
    "bs_payables_and_accrued_expenses": "Payables And Accrued Expenses",
    "bs_current_accrued_expenses": "Current Accrued Expenses",
    "bs_current_deferred_liabilities": "Current Deferred Liabilities",
    "bs_current_deferred_revenue": "Current Deferred Revenue",
    "bs_current_debt": "Current Debt",
    "bs_current_debt_and_capital_lease_obligation": "Current Debt And Capital Lease Obligation",
    "bs_current_capital_lease_obligation": "Current Capital Lease Obligation",
    "bs_commercial_paper": "Commercial Paper",
    "bs_other_current_borrowings": "Other Current Borrowings",
    "bs_other_current_liabilities": "Other Current Liabilities",
    "bs_income_tax_payable": "Income Tax Payable",
    "bs_total_tax_payable": "Total Tax Payable",
    "bs_total_debt": "Total Debt",
    "bs_long_term_debt": "Long Term Debt",
    "bs_long_term_debt_and_capital_lease_obligation": "Long Term Debt And Capital Lease Obligation",
    "bs_long_term_capital_lease_obligation": "Long Term Capital Lease Obligation",
    "bs_capital_lease_obligations": "Capital Lease Obligations",
    "bs_net_debt": "Net Debt",
    "bs_tradeand_other_payables_non_current": "Tradeand Other Payables Non Current",
    "bs_other_non_current_liabilities": "Other Non Current Liabilities",
    "bs_total_equity_gross_minority_interest": "Total Equity Gross Minority Interest",
    "bs_stockholders_equity": "Stockholders Equity",
    "bs_common_stock_equity": "Common Stock Equity",
    "bs_capital_stock": "Capital Stock",
    "bs_common_stock": "Common Stock",
    "bs_retained_earnings": "Retained Earnings",
    "bs_gains_losses_not_affecting_retained_earnings": "Gains Losses Not Affecting Retained Earnings",
    "bs_other_equity_adjustments": "Other Equity Adjustments",
    "bs_treasury_shares_number": "Treasury Shares Number",
    "bs_share_issued": "Share Issued",
    "bs_ordinary_shares_number": "Ordinary Shares Number",
    "bs_tangible_book_value": "Tangible Book Value",
    "bs_net_tangible_assets": "Net Tangible Assets",
    "bs_invested_capital": "Invested Capital",
    "bs_total_capitalization": "Total Capitalization",
    "bs_working_capital": "Working Capital",
}


def extract_balance_sheet_columns(stock) -> dict:
    """Extract most recent annual balance sheet into bs_* columns."""
    try:
        bs = stock.balance_sheet
        if bs is None or bs.empty:
            return {}
        latest = bs.iloc[:, 0]
        result = {}
        for col_name, yf_key in BS_FIELD_MAP.items():
            result[col_name] = safe_number(_safe_get(latest, yf_key))
        return result
    except Exception:
        return {}


# ─── Extract Income Statement → individual columns ──────────────────

IS_FIELD_MAP = {
    "is_total_revenue": "Total Revenue",
    "is_operating_revenue": "Operating Revenue",
    "is_cost_of_revenue": "Cost Of Revenue",
    "is_reconciled_cost_of_revenue": "Reconciled Cost Of Revenue",
    "is_gross_profit": "Gross Profit",
    "is_operating_expense": "Operating Expense",
    "is_total_expenses": "Total Expenses",
    "is_selling_general_and_administration": "Selling General And Administration",
    "is_research_and_development": "Research And Development",
    "is_operating_income": "Operating Income",
    "is_total_operating_income_as_reported": "Total Operating Income As Reported",
    "is_net_non_operating_interest_income_expense": "Net Non Operating Interest Income Expense",
    "is_interest_income": "Interest Income",
    "is_interest_income_non_operating": "Interest Income Non Operating",
    "is_interest_expense": "Interest Expense",
    "is_interest_expense_non_operating": "Interest Expense Non Operating",
    "is_net_interest_income": "Net Interest Income",
    "is_other_income_expense": "Other Income Expense",
    "is_other_non_operating_income_expenses": "Other Non Operating Income Expenses",
    "is_pretax_income": "Pretax Income",
    "is_tax_provision": "Tax Provision",
    "is_tax_rate_for_calcs": "Tax Rate For Calcs",
    "is_tax_effect_of_unusual_items": "Tax Effect Of Unusual Items",
    "is_net_income": "Net Income",
    "is_net_income_common_stockholders": "Net Income Common Stockholders",
    "is_net_income_continuous_operations": "Net Income Continuous Operations",
    "is_net_income_from_continuing_and_discontinued_operation": "Net Income From Continuing And Discontinued Operation",
    "is_net_income_from_continuing_operation_net_minority_interest": "Net Income From Continuing Operation Net Minority Interest",
    "is_net_income_including_noncontrolling_interests": "Net Income Including Noncontrolling Interests",
    "is_diluted_ni_availto_com_stockholders": "Diluted NI Availto Com Stockholders",
    "is_normalized_income": "Normalized Income",
    "is_ebit": "EBIT",
    "is_ebitda": "EBITDA",
    "is_normalized_ebitda": "Normalized EBITDA",
    "is_reconciled_depreciation": "Reconciled Depreciation",
    "is_basic_eps": "Basic EPS",
    "is_diluted_eps": "Diluted EPS",
    "is_basic_average_shares": "Basic Average Shares",
    "is_diluted_average_shares": "Diluted Average Shares",
}


def extract_income_stmt_columns(stock) -> dict:
    """Extract most recent annual income statement into is_* columns."""
    try:
        inc = stock.income_stmt
        if inc is None or inc.empty:
            return {}
        latest = inc.iloc[:, 0]
        result = {}
        for col_name, yf_key in IS_FIELD_MAP.items():
            result[col_name] = safe_number(_safe_get(latest, yf_key))
        return result
    except Exception:
        return {}


# ─── Extract Cash Flow → individual columns ─────────────────────────

CF_FIELD_MAP = {
    "cf_operating_cash_flow": "Operating Cash Flow",
    "cf_cash_flow_from_continuing_operating_activities": "Cash Flow From Continuing Operating Activities",
    "cf_net_income_from_continuing_operations": "Net Income From Continuing Operations",
    "cf_depreciation_and_amortization": "Depreciation And Amortization",
    "cf_depreciation_amortization_depletion": "Depreciation Amortization Depletion",
    "cf_stock_based_compensation": "Stock Based Compensation",
    "cf_deferred_income_tax": "Deferred Income Tax",
    "cf_deferred_tax": "Deferred Tax",
    "cf_other_non_cash_items": "Other Non Cash Items",
    "cf_change_in_working_capital": "Change In Working Capital",
    "cf_change_in_receivables": "Change In Receivables",
    "cf_changes_in_account_receivables": "Changes In Account Receivables",
    "cf_change_in_inventory": "Change In Inventory",
    "cf_change_in_payable": "Change In Payable",
    "cf_change_in_account_payable": "Change In Account Payable",
    "cf_change_in_payables_and_accrued_expense": "Change In Payables And Accrued Expense",
    "cf_change_in_other_current_assets": "Change In Other Current Assets",
    "cf_change_in_other_current_liabilities": "Change In Other Current Liabilities",
    "cf_change_in_other_working_capital": "Change In Other Working Capital",
    "cf_income_tax_paid_supplemental_data": "Income Tax Paid Supplemental Data",
    "cf_interest_paid_supplemental_data": "Interest Paid Supplemental Data",
    "cf_investing_cash_flow": "Investing Cash Flow",
    "cf_cash_flow_from_continuing_investing_activities": "Cash Flow From Continuing Investing Activities",
    "cf_capital_expenditure": "Capital Expenditure",
    "cf_purchase_of_ppe": "Purchase Of PPE",
    "cf_net_ppe_purchase_and_sale": "Net PPE Purchase And Sale",
    "cf_purchase_of_investment": "Purchase Of Investment",
    "cf_sale_of_investment": "Sale Of Investment",
    "cf_net_investment_purchase_and_sale": "Net Investment Purchase And Sale",
    "cf_purchase_of_business": "Purchase Of Business",
    "cf_net_business_purchase_and_sale": "Net Business Purchase And Sale",
    "cf_net_other_investing_changes": "Net Other Investing Changes",
    "cf_financing_cash_flow": "Financing Cash Flow",
    "cf_cash_flow_from_continuing_financing_activities": "Cash Flow From Continuing Financing Activities",
    "cf_issuance_of_capital_stock": "Issuance Of Capital Stock",
    "cf_common_stock_issuance": "Common Stock Issuance",
    "cf_net_common_stock_issuance": "Net Common Stock Issuance",
    "cf_repurchase_of_capital_stock": "Repurchase Of Capital Stock",
    "cf_common_stock_payments": "Common Stock Payments",
    "cf_cash_dividends_paid": "Cash Dividends Paid",
    "cf_common_stock_dividend_paid": "Common Stock Dividend Paid",
    "cf_issuance_of_debt": "Issuance Of Debt",
    "cf_long_term_debt_issuance": "Long Term Debt Issuance",
    "cf_net_long_term_debt_issuance": "Net Long Term Debt Issuance",
    "cf_long_term_debt_payments": "Long Term Debt Payments",
    "cf_repayment_of_debt": "Repayment Of Debt",
    "cf_net_issuance_payments_of_debt": "Net Issuance Payments Of Debt",
    "cf_net_short_term_debt_issuance": "Net Short Term Debt Issuance",
    "cf_net_other_financing_charges": "Net Other Financing Charges",
    "cf_free_cash_flow": "Free Cash Flow",
    "cf_changes_in_cash": "Changes In Cash",
    "cf_beginning_cash_position": "Beginning Cash Position",
    "cf_end_cash_position": "End Cash Position",
}


def extract_cashflow_columns(stock) -> dict:
    """Extract most recent annual cash flow into cf_* columns."""
    try:
        cf = stock.cashflow
        if cf is None or cf.empty:
            return {}
        latest = cf.iloc[:, 0]
        result = {}
        for col_name, yf_key in CF_FIELD_MAP.items():
            result[col_name] = safe_number(_safe_get(latest, yf_key))
        return result
    except Exception:
        return {}


# ─── Collect quarterly data as JSONB ─────────────────────────────────

def collect_quarterly_data(stock) -> dict | None:
    """Collect quarterly statements into a compact JSONB for raw_quarterly."""
    quarterly = {}
    try:
        quarterly["quarterly_balance_sheet"] = dataframe_to_dict(stock.quarterly_balance_sheet)
    except Exception:
        pass
    try:
        quarterly["quarterly_income_stmt"] = dataframe_to_dict(stock.quarterly_income_stmt)
    except Exception:
        pass
    try:
        quarterly["quarterly_cashflow"] = dataframe_to_dict(stock.quarterly_cashflow)
    except Exception:
        pass

    # Only store if we got at least something
    if any(v for v in quarterly.values()):
        return sanitize_for_json(quarterly)
    return None


# ─── Screening ───────────────────────────────────────────────────────

def screen_and_store(ticker_info: dict) -> str:
    """Screen a single ticker and store everything. Returns status string."""
    ticker = ticker_info["ticker"]
    now = datetime.now(timezone.utc).isoformat()

    # Create yfinance Ticker object (shared across all extractions)
    stock = yf.Ticker(ticker)

    # Extract info dict
    try:
        info = stock.info or {}
    except Exception:
        info = {}

    # Extract all individual columns
    info_cols = extract_info_columns(info)
    bs_cols = extract_balance_sheet_columns(stock)
    is_cols = extract_income_stmt_columns(stock)
    cf_cols = extract_cashflow_columns(stock)
    raw_quarterly = collect_quarterly_data(stock)

    # Attempt AAOIFI screening
    try:
        report = screen_stock(ticker)
    except Exception as exc:
        # Store what we have even on screening error
        row = {
            "ticker": ticker,
            "company_name": ticker_info["company_name"],
            "cik": ticker_info["cik"],
            "status": "error",
            "error_message": str(exc)[:1000],
            "screened_at": now,
            "raw_quarterly": raw_quarterly,
        }
        row.update(info_cols)
        row.update(bs_cols)
        row.update(is_cols)
        row.update(cf_cols)
        upsert_result(row)
        return "error"

    fin = report.financials
    status_str = "compliant" if report.status == ComplianceStatus.COMPLIANT else "non_compliant"

    # Compute ratios
    debt_ratio = safe_number(fin.total_debt / fin.market_cap) if fin.market_cap > 0 else None
    deposit_ratio = safe_number(fin.interest_bearing_deposits / fin.market_cap) if fin.market_cap > 0 else None
    income_ratio = safe_number(fin.prohibited_income / fin.total_income) if fin.total_income > 0 else None
    tangibility_ratio = safe_number(
        1 - (fin.cash + fin.receivables) / fin.total_assets
    ) if fin.total_assets > 0 else None

    violations = [
        {
            "violated_standard": v.violated_standard,
            "requirement": v.requirement,
            "input_value": v.input_value,
            "compliance_delta": v.compliance_delta,
        }
        for v in report.violations
    ]

    raw_financials = sanitize_for_json({
        "market_cap": fin.market_cap,
        "total_debt": fin.total_debt,
        "interest_bearing_deposits": fin.interest_bearing_deposits,
        "prohibited_income": fin.prohibited_income,
        "total_income": fin.total_income,
        "cash": fin.cash,
        "receivables": fin.receivables,
        "total_assets": fin.total_assets,
    })

    # Build the full row
    row = {
        "ticker": ticker,
        "company_name": ticker_info["company_name"],
        "cik": ticker_info["cik"],
        "status": status_str,
        "sector": fin.sector or None,
        "industry": fin.industry or None,
        "debt_ratio": debt_ratio,
        "deposit_ratio": deposit_ratio,
        "income_ratio": income_ratio,
        "tangibility_ratio": tangibility_ratio,
        "violations": violations if violations else None,
        "raw_financials": raw_financials,
        "error_message": None,
        "screened_at": now,
        "raw_quarterly": raw_quarterly,
    }
    row.update(info_cols)
    row.update(bs_cols)
    row.update(is_cols)
    row.update(cf_cols)

    upsert_result(row)
    return status_str


# ─── Main ────────────────────────────────────────────────────────────

def main():
    log.info("=" * 60)
    log.info("AAOIFI Full US Market Screening")
    log.info("=" * 60)

    tickers = fetch_tickers()

    log.info("Checking Supabase for completely screened tickers...")
    complete = get_complete_tickers()
    to_screen = [t for t in tickers if t["ticker"] not in complete]
    skipped = len(tickers) - len(to_screen)

    log.info("Total tickers:   %d", len(tickers))
    log.info("Already complete: %d (within %d days, with full data)", skipped, STALE_DAYS)
    log.info("To screen:       %d (new + incomplete + errors)", len(to_screen))
    log.info("Est. time:       ~%.0f minutes", len(to_screen) * SLEEP_BETWEEN / 60)
    log.info("-" * 60)

    if not to_screen:
        log.info("Nothing to do — all tickers are up to date.")
        return

    counts = {"compliant": 0, "non_compliant": 0, "error": 0}
    start = time.time()

    for i, ticker_info in enumerate(to_screen, 1):
        ticker = ticker_info["ticker"]

        try:
            status = screen_and_store(ticker_info)
        except Exception as exc:
            # Catch-all so the loop never dies
            log.error("[%d/%d] %s → FATAL ERROR: %s", i, len(to_screen), ticker, exc)
            counts["error"] += 1
            time.sleep(SLEEP_BETWEEN)
            continue

        counts[status] += 1

        elapsed = time.time() - start
        rate = i / elapsed if elapsed > 0 else 0
        eta_min = (len(to_screen) - i) / rate / 60 if rate > 0 else 0

        if i % BATCH_LOG_EVERY == 0 or i == len(to_screen) or i <= 5:
            log.info(
                "[%d/%d] %s → %s  |  %.1f/s  ETA %.0fm  |  C:%d  NC:%d  E:%d",
                i, len(to_screen), ticker, status.upper(),
                rate, eta_min,
                counts["compliant"], counts["non_compliant"], counts["error"],
            )

        time.sleep(SLEEP_BETWEEN)

    elapsed_total = (time.time() - start) / 60
    log.info("=" * 60)
    log.info("COMPLETE in %.1f minutes", elapsed_total)
    log.info("Compliant:     %d", counts["compliant"])
    log.info("Non-compliant: %d", counts["non_compliant"])
    log.info("Errors:        %d", counts["error"])
    log.info("=" * 60)


if __name__ == "__main__":
    main()
