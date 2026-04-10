"""
Module IV: Zakah Calculation Engine

Implements Zakah computation per AAOIFI Shari'ah Standards SS (35) and SS (50).

Execution flow:
    1. Nisab Validation: Compare net assets against the market value of 85g of gold.
       If below Nisab, Zakah obligation is zero.
    2. Asset Classification:
       - Trade/Business assets: 2.5% flat rate (SS 35).
       - Agricultural produce, rain-fed/natural irrigation: 10% (SS 50).
       - Agricultural produce, mechanical/artificial irrigation: 5% (SS 50).
    3. Computation: Zakah Due = Rate x Net Zakatable Assets.

System constants:
    - Gold Nisab: 85 grams
    - Silver Nisab: 595 grams (alternative; gold is used by default)

Reference: AAOIFI Shari'ah Standards (2017 Edition), Standards 35 & 50
"""

from aaoifi.constants import (
    GOLD_NISAB_GRAMS,
    ZAKAH_RATE_BUSINESS,
    ZAKAH_RATE_MECHANICAL,
    ZAKAH_RATE_RAIN_FED,
)
from aaoifi.models import AssetType, IrrigationType, ZakahInput, ZakahResult


def compute_zakah(zakah_input: ZakahInput) -> ZakahResult:
    """Compute the Zakah obligation for a given set of assets.

    Performs Nisab eligibility check against the gold standard, then applies
    the appropriate rate based on asset type and irrigation method.

    Args:
        zakah_input: The Zakah computation parameters including net assets,
                     current gold price, asset type, and irrigation type.

    Returns:
        ZakahResult containing eligibility status, applicable rate,
        and the computed Zakah amount due.
    """
    nisab_value = GOLD_NISAB_GRAMS * zakah_input.gold_price_per_gram

    if zakah_input.net_assets < nisab_value:
        return ZakahResult(
            eligible=False,
            nisab_value=nisab_value,
            net_assets=zakah_input.net_assets,
            rate=0.0,
            zakah_due=0.0,
        )

    rate = _get_rate(zakah_input.asset_type, zakah_input.irrigation_type)
    zakah_due = rate * zakah_input.net_assets

    return ZakahResult(
        eligible=True,
        nisab_value=nisab_value,
        net_assets=zakah_input.net_assets,
        rate=rate,
        zakah_due=zakah_due,
    )


def _get_rate(asset_type: AssetType, irrigation_type: IrrigationType) -> float:
    """Determine the applicable Zakah rate based on asset classification.

    Args:
        asset_type: Whether the assets are business/trade or agricultural.
        irrigation_type: For agriculture, whether irrigation is natural or mechanical.

    Returns:
        The Zakah rate as a decimal (e.g., 0.025 for 2.5%).
    """
    if asset_type == AssetType.BUSINESS:
        return ZAKAH_RATE_BUSINESS

    # Agriculture per SS (50)
    if irrigation_type == IrrigationType.RAIN_FED:
        return ZAKAH_RATE_RAIN_FED
    return ZAKAH_RATE_MECHANICAL
