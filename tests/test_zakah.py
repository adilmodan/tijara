"""Tests for Module IV: Zakah Calculation Engine."""

from aaoifi.models import AssetType, IrrigationType, ZakahInput
from aaoifi.zakah import compute_zakah


class TestZakahComputation:
    """Verify Zakah computation logic per SS (35) and SS (50)."""

    def test_below_nisab_no_zakah(self):
        """Assets below Nisab threshold — no Zakah obligation."""
        result = compute_zakah(ZakahInput(
            net_assets=5_000,
            gold_price_per_gram=90.0,  # Nisab = 85 * 90 = $7,650
        ))
        assert not result.eligible
        assert result.zakah_due == 0.0
        assert result.nisab_value == 85 * 90.0

    def test_business_assets_2_5_percent(self):
        """Business assets above Nisab — 2.5% rate per SS (35)."""
        result = compute_zakah(ZakahInput(
            net_assets=100_000,
            gold_price_per_gram=90.0,
            asset_type=AssetType.BUSINESS,
        ))
        assert result.eligible
        assert result.rate == 0.025
        assert result.zakah_due == 100_000 * 0.025  # $2,500

    def test_agriculture_rain_fed_10_percent(self):
        """Rain-fed agriculture — 10% rate per SS (50)."""
        result = compute_zakah(ZakahInput(
            net_assets=50_000,
            gold_price_per_gram=90.0,
            asset_type=AssetType.AGRICULTURE,
            irrigation_type=IrrigationType.RAIN_FED,
        ))
        assert result.eligible
        assert result.rate == 0.10
        assert result.zakah_due == 50_000 * 0.10  # $5,000

    def test_agriculture_mechanical_5_percent(self):
        """Mechanical irrigation agriculture — 5% rate per SS (50)."""
        result = compute_zakah(ZakahInput(
            net_assets=50_000,
            gold_price_per_gram=90.0,
            asset_type=AssetType.AGRICULTURE,
            irrigation_type=IrrigationType.MECHANICAL,
        ))
        assert result.eligible
        assert result.rate == 0.05
        assert result.zakah_due == 50_000 * 0.05  # $2,500

    def test_exactly_at_nisab(self):
        """Assets exactly at Nisab — Zakah is obligatory."""
        nisab = 85 * 90.0  # $7,650
        result = compute_zakah(ZakahInput(
            net_assets=nisab,
            gold_price_per_gram=90.0,
        ))
        assert result.eligible
        assert result.zakah_due == nisab * 0.025

    def test_nisab_scales_with_gold_price(self):
        """Higher gold price raises the Nisab threshold."""
        result_low = compute_zakah(ZakahInput(net_assets=10_000, gold_price_per_gram=50.0))
        result_high = compute_zakah(ZakahInput(net_assets=10_000, gold_price_per_gram=200.0))
        # $10k is above Nisab at $50/g (Nisab=$4,250) but below at $200/g (Nisab=$17,000)
        assert result_low.eligible
        assert not result_high.eligible
