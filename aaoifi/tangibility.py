"""
Module III: Asset Composition and Tangibility Screening

Implements the tangible asset composition gate per AAOIFI Shari'ah Standard SS (21).
This ensures that share trading represents an exchange of real business interests
rather than a disguised exchange of money for money (Riba).

Requirement (per SS 21):
    - Tangible assets must constitute at least 30% of total assets.
    - Equivalently: Cash + Receivables (monetary assets) must not exceed 70%.

If monetary assets dominate the balance sheet, the company is effectively a
cash shell and trading its shares approximates currency exchange — prohibited
under Shari'ah as it constitutes Riba.

Reference: AAOIFI Shari'ah Standards (2017 Edition), Standard 21 — Financial Paper
"""

from aaoifi.constants import MIN_TANGIBILITY
from aaoifi.models import ComplianceStatus, ScreeningResult, Violation


def screen_tangibility(
    cash: float, receivables: float, total_assets: float
) -> ScreeningResult:
    """Verify minimum tangible asset composition per SS (21).

    Computes tangibility as:
        tangible_ratio = 1 - (cash + receivables) / total_assets

    The logic gate requires tangible_ratio >= 30%.

    Args:
        cash: Total cash and cash equivalents.
        receivables: Total accounts receivable and short-term receivables.
        total_assets: Total assets on the balance sheet.

    Returns:
        ScreeningResult — COMPLIANT if tangible_ratio >= 30%,
        NON_COMPLIANT otherwise.
    """
    if total_assets <= 0:
        return ScreeningResult(
            status=ComplianceStatus.NON_COMPLIANT,
            violations=[
                Violation(
                    violated_standard="SS (21)",
                    requirement="Tangibility screening requires positive Total Assets",
                    input_value="Total Assets <= 0",
                    compliance_delta="Cannot compute ratio — denominator is non-positive",
                )
            ],
        )

    monetary_ratio = (cash + receivables) / total_assets
    tangible_ratio = 1.0 - monetary_ratio

    if tangible_ratio < MIN_TANGIBILITY:
        return ScreeningResult(
            status=ComplianceStatus.NON_COMPLIANT,
            violations=[
                Violation(
                    violated_standard="SS (21)",
                    requirement=f"Tangible Assets / Total Assets >= {MIN_TANGIBILITY:.0%}",
                    input_value=f"{tangible_ratio:.4%}",
                    compliance_delta=f"-{MIN_TANGIBILITY - tangible_ratio:.4%} below threshold",
                )
            ],
        )

    return ScreeningResult(status=ComplianceStatus.COMPLIANT)
