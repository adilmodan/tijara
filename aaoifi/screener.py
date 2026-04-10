"""
Screener: Orchestration Layer

The top-level entry point for the AAOIFI Shari'ah Compliance Engine. This module
composes the individual screening modules into a complete pipeline:

    1. Fetch financial data (data.py)
    2. Qualitative sector screening (qualitative.py) — binary hard stop
    3. Quantitative financial ratio screening (quantitative.py)
    4. Tangible asset composition check (tangibility.py)
    5. Aggregate results into FullScreeningReport

The pipeline short-circuits: if the qualitative check fails, no quantitative
analysis is performed — the stock is unconditionally non-compliant.

Contract validation (contractual.py) and Zakah computation (zakah.py) are
exposed as standalone functions since they operate on different input domains.

Usage:
    from aaoifi import screen_stock
    report = screen_stock("AAPL")
    print(report.status)  # ComplianceStatus.COMPLIANT or NON_COMPLIANT
"""

from __future__ import annotations

from aaoifi.contractual import validate_contract
from aaoifi.data import fetch_financials
from aaoifi.models import (
    CompanyFinancials,
    ComplianceStatus,
    ContractInput,
    FullScreeningReport,
    ScreeningResult,
    Violation,
)
from aaoifi.qualitative import screen_sector
from aaoifi.quantitative import (
    screen_debt,
    screen_interest_deposits,
    screen_prohibited_income,
)
from aaoifi.tangibility import screen_tangibility


def screen_stock(ticker: str) -> FullScreeningReport:
    """Run the full AAOIFI compliance screening pipeline on a stock ticker.

    Fetches financial data from Yahoo Finance, then executes all screening
    modules in sequence. Short-circuits on qualitative failure.

    Args:
        ticker: Stock ticker symbol (e.g., "AAPL", "MSFT", "2222.SR").

    Returns:
        FullScreeningReport with aggregate compliance status and all violations.

    Raises:
        ValueError: If the ticker cannot be resolved.
    """
    financials = fetch_financials(ticker)
    return screen_financials(financials)


def screen_financials(financials: CompanyFinancials) -> FullScreeningReport:
    """Run the full screening pipeline on pre-fetched financial data.

    Use this when you already have CompanyFinancials (e.g., from a brokerage API
    or manual input) and don't need yfinance.

    Args:
        financials: Pre-populated company financial data.

    Returns:
        FullScreeningReport with aggregate compliance status and all violations.
    """
    all_violations: list[Violation] = []

    # --- Module I: Qualitative Sector Screening (binary hard stop) ---
    qual_result = screen_sector(financials.sector, financials.industry)
    if qual_result.status == ComplianceStatus.NON_COMPLIANT:
        return FullScreeningReport(
            ticker=financials.ticker,
            status=ComplianceStatus.NON_COMPLIANT,
            financials=financials,
            qualitative=qual_result,
            violations=qual_result.violations,
        )

    # --- Module II: Quantitative Financial Ratio Screening ---
    quant_violations: list[Violation] = []

    debt_result = screen_debt(financials.total_debt, financials.market_cap)
    quant_violations.extend(debt_result.violations)

    interest_result = screen_interest_deposits(
        financials.interest_bearing_deposits, financials.market_cap
    )
    quant_violations.extend(interest_result.violations)

    if financials.total_income > 0:
        income_result = screen_prohibited_income(
            financials.prohibited_income, financials.total_income
        )
        quant_violations.extend(income_result.violations)

    quant_status = (
        ComplianceStatus.NON_COMPLIANT if quant_violations
        else ComplianceStatus.COMPLIANT
    )
    quant_result = ScreeningResult(status=quant_status, violations=quant_violations)
    all_violations.extend(quant_violations)

    # --- Module III: Asset Composition / Tangibility ---
    tang_result = screen_tangibility(
        financials.cash, financials.receivables, financials.total_assets
    )
    all_violations.extend(tang_result.violations)

    # --- Aggregate ---
    overall_status = (
        ComplianceStatus.NON_COMPLIANT if all_violations
        else ComplianceStatus.COMPLIANT
    )

    return FullScreeningReport(
        ticker=financials.ticker,
        status=overall_status,
        financials=financials,
        qualitative=qual_result,
        quantitative=quant_result,
        tangibility=tang_result,
        violations=all_violations,
    )


def screen_contract(contract: ContractInput) -> ScreeningResult:
    """Validate a Musharakah/Mudarabah contract against SS (12) / SS (13).

    Standalone entry point for contractual validation — does not require
    stock data or sector screening.

    Args:
        contract: Partnership contract parameters (profit basis, loss/capital ratios).

    Returns:
        ScreeningResult with COMPLIANT or NON_COMPLIANT status.
    """
    return validate_contract(contract)
