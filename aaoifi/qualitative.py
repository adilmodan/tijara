"""
Module I: Qualitative Industry Screening Logic (Binary Hard Stop)

Implements the sector-level compliance gate per AAOIFI Shari'ah Standard SS (21).
This is the first filter in the screening pipeline — if a company operates in a
prohibited sector, all further analysis is terminated immediately.

Prohibited sectors (per SS 21):
    - Conventional Finance: interest-based banking, conventional insurance, usury
    - Liquor/Alcohol: production, trade, distribution, or storage of intoxicants
    - Pork-related Products: production, slaughtering, or trade of swine products
    - Gambling/Casinos: gaming, casinos, and gambling-related technology

Reference: AAOIFI Shari'ah Standards (2017 Edition), Standard 21 — Financial Paper
"""

from aaoifi.constants import PROHIBITED_INDUSTRY_KEYWORDS, PROHIBITED_SECTOR_KEYWORDS
from aaoifi.models import ComplianceStatus, ScreeningResult, Violation


def screen_sector(sector: str, industry: str) -> ScreeningResult:
    """Execute the qualitative sector check against the AAOIFI prohibition list.

    This is a binary filter: if any prohibited keyword matches the company's
    sector or industry classification, the result is NON-COMPLIANT and all
    downstream processing must halt.

    Args:
        sector: Company sector classification (e.g., "Financial Services").
        industry: Company industry classification (e.g., "Diversified Banks").

    Returns:
        ScreeningResult with COMPLIANT status if the sector passes, or
        NON_COMPLIANT with a Violation referencing SS (21).
    """
    sector_lower = sector.lower()
    industry_lower = industry.lower()

    # Check industry against exact AAOIFI-prohibited industry names
    if industry_lower in PROHIBITED_INDUSTRY_KEYWORDS:
        return _fail(sector, industry, f"Industry '{industry}' is prohibited")

    # Check both sector and industry against prohibited keyword set
    for keyword in PROHIBITED_SECTOR_KEYWORDS:
        if keyword in sector_lower or keyword in industry_lower:
            return _fail(
                sector, industry,
                f"Keyword '{keyword}' matched in sector/industry classification"
            )

    return ScreeningResult(status=ComplianceStatus.COMPLIANT)


def _fail(sector: str, industry: str, reason: str) -> ScreeningResult:
    """Build a NON-COMPLIANT result for a prohibited sector match."""
    return ScreeningResult(
        status=ComplianceStatus.NON_COMPLIANT,
        violations=[
            Violation(
                violated_standard="SS (21)",
                requirement="Company must not operate in a prohibited sector "
                            "(Conventional Finance, Alcohol, Pork, Gambling)",
                input_value=f"Sector='{sector}', Industry='{industry}'",
                compliance_delta=reason,
            )
        ],
    )
