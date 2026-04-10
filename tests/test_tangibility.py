"""Tests for Module III: Asset Composition and Tangibility Screening."""

from aaoifi.models import ComplianceStatus
from aaoifi.tangibility import screen_tangibility


class TestTangibilityScreening:
    """Verify tangible asset composition gate (30% minimum)."""

    def test_compliant_high_tangibility(self):
        # 50% tangible: cash=300k, receivables=200k, total=1M
        result = screen_tangibility(cash=300_000, receivables=200_000, total_assets=1_000_000)
        assert result.status == ComplianceStatus.COMPLIANT

    def test_compliant_at_threshold(self):
        # Exactly 30% tangible: monetary = 70%
        result = screen_tangibility(cash=500_000, receivables=200_000, total_assets=1_000_000)
        assert result.status == ComplianceStatus.COMPLIANT

    def test_fail_below_threshold(self):
        # 20% tangible: monetary = 80%
        result = screen_tangibility(cash=600_000, receivables=200_000, total_assets=1_000_000)
        assert result.status == ComplianceStatus.NON_COMPLIANT
        assert "30%" in result.violations[0].requirement

    def test_fail_all_cash(self):
        # 0% tangible
        result = screen_tangibility(cash=1_000_000, receivables=0, total_assets=1_000_000)
        assert result.status == ComplianceStatus.NON_COMPLIANT

    def test_fail_zero_total_assets(self):
        result = screen_tangibility(cash=100_000, receivables=0, total_assets=0)
        assert result.status == ComplianceStatus.NON_COMPLIANT

    def test_compliant_all_tangible(self):
        # 100% tangible: no cash or receivables
        result = screen_tangibility(cash=0, receivables=0, total_assets=1_000_000)
        assert result.status == ComplianceStatus.COMPLIANT
