"""
Module II: Quantitative Financial Screening Logic

Implements the three numerical ratio gates per AAOIFI Shari'ah Standard SS (21).
Each gate is an independent hard constraint — any single failure renders the
equity non-compliant.

Screening thresholds (per SS 21):
    - Debt Level: Total Debt / Market Cap <= 30%
    - Interest-Bearing Deposits: Interest Deposits / Market Cap <= 30%
    - Non-Compliant Income: Prohibited Income / Total Income <= 5%

All ratios use Market Capitalization as the denominator (except non-compliant
income which uses Total Income). This is the AAOIFI-specified basis, distinct
from some other screening methodologies that use Total Assets.

Reference: AAOIFI Shari'ah Standards (2017 Edition), Standard 21 — Financial Paper
"""

from aaoifi.constants import (
    DEBT_THRESHOLD,
    INTEREST_DEPOSIT_THRESHOLD,
    PROHIBITED_INCOME_CAP,
)
from aaoifi.models import ComplianceStatus, ScreeningResult, Violation


def screen_debt(total_debt: float, market_cap: float) -> ScreeningResult:
    """Check debt-to-market-cap ratio against the 30% AAOIFI threshold.

    Args:
        total_debt: Total interest-bearing debt on the balance sheet.
        market_cap: Current market capitalization of the company.

    Returns:
        ScreeningResult — COMPLIANT if ratio <= 30%, NON_COMPLIANT otherwise.
    """
    if market_cap <= 0:
        return _fail_zero_denominator("Debt Level", "Market Capitalization")

    ratio = total_debt / market_cap
    if ratio > DEBT_THRESHOLD:
        return ScreeningResult(
            status=ComplianceStatus.NON_COMPLIANT,
            violations=[
                Violation(
                    violated_standard="SS (21)",
                    requirement=f"Total Debt / Market Cap <= {DEBT_THRESHOLD:.0%}",
                    input_value=f"{ratio:.4%}",
                    compliance_delta=f"+{ratio - DEBT_THRESHOLD:.4%} above threshold",
                )
            ],
        )
    return ScreeningResult(status=ComplianceStatus.COMPLIANT)


def screen_interest_deposits(
    interest_bearing_deposits: float, market_cap: float
) -> ScreeningResult:
    """Check interest-bearing deposits ratio against the 30% AAOIFI threshold.

    Args:
        interest_bearing_deposits: Total interest-bearing deposits/securities.
        market_cap: Current market capitalization of the company.

    Returns:
        ScreeningResult — COMPLIANT if ratio <= 30%, NON_COMPLIANT otherwise.
    """
    if market_cap <= 0:
        return _fail_zero_denominator("Interest Deposits", "Market Capitalization")

    ratio = interest_bearing_deposits / market_cap
    if ratio > INTEREST_DEPOSIT_THRESHOLD:
        return ScreeningResult(
            status=ComplianceStatus.NON_COMPLIANT,
            violations=[
                Violation(
                    violated_standard="SS (21)",
                    requirement=f"Interest Deposits / Market Cap <= {INTEREST_DEPOSIT_THRESHOLD:.0%}",
                    input_value=f"{ratio:.4%}",
                    compliance_delta=f"+{ratio - INTEREST_DEPOSIT_THRESHOLD:.4%} above threshold",
                )
            ],
        )
    return ScreeningResult(status=ComplianceStatus.COMPLIANT)


def screen_prohibited_income(
    prohibited_income: float, total_income: float
) -> ScreeningResult:
    """Check non-compliant income ratio against the 5% AAOIFI threshold.

    Non-compliant income includes any revenue derived from prohibited activities
    (interest income, alcohol sales, gambling revenue, etc.).

    Args:
        prohibited_income: Total income from prohibited sources.
        total_income: Total revenue/income of the company.

    Returns:
        ScreeningResult — COMPLIANT if ratio <= 5%, NON_COMPLIANT otherwise.
    """
    if total_income <= 0:
        return _fail_zero_denominator("Prohibited Income", "Total Income")

    ratio = prohibited_income / total_income
    if ratio > PROHIBITED_INCOME_CAP:
        return ScreeningResult(
            status=ComplianceStatus.NON_COMPLIANT,
            violations=[
                Violation(
                    violated_standard="SS (21)",
                    requirement=f"Prohibited Income / Total Income <= {PROHIBITED_INCOME_CAP:.0%}",
                    input_value=f"{ratio:.4%}",
                    compliance_delta=f"+{ratio - PROHIBITED_INCOME_CAP:.4%} above threshold",
                )
            ],
        )
    return ScreeningResult(status=ComplianceStatus.COMPLIANT)


def _fail_zero_denominator(metric: str, denominator: str) -> ScreeningResult:
    """Return NON-COMPLIANT when the denominator is zero or negative."""
    return ScreeningResult(
        status=ComplianceStatus.NON_COMPLIANT,
        violations=[
            Violation(
                violated_standard="SS (21)",
                requirement=f"{metric} screening requires positive {denominator}",
                input_value=f"{denominator} <= 0",
                compliance_delta="Cannot compute ratio — denominator is non-positive",
            )
        ],
    )
