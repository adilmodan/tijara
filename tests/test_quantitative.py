"""Tests for Module II: Quantitative Financial Screening."""

from aaoifi.models import ComplianceStatus
from aaoifi.quantitative import (
    screen_debt,
    screen_interest_deposits,
    screen_prohibited_income,
)


class TestDebtScreening:
    """Verify debt-to-market-cap ratio gate (30% threshold)."""

    def test_compliant_low_debt(self):
        result = screen_debt(total_debt=200_000, market_cap=1_000_000)
        assert result.status == ComplianceStatus.COMPLIANT

    def test_compliant_at_threshold(self):
        result = screen_debt(total_debt=300_000, market_cap=1_000_000)
        assert result.status == ComplianceStatus.COMPLIANT

    def test_fail_above_threshold(self):
        result = screen_debt(total_debt=350_000, market_cap=1_000_000)
        assert result.status == ComplianceStatus.NON_COMPLIANT
        assert "30%" in result.violations[0].requirement

    def test_fail_zero_market_cap(self):
        result = screen_debt(total_debt=100_000, market_cap=0)
        assert result.status == ComplianceStatus.NON_COMPLIANT

    def test_zero_debt_passes(self):
        result = screen_debt(total_debt=0, market_cap=1_000_000)
        assert result.status == ComplianceStatus.COMPLIANT


class TestInterestDepositScreening:
    """Verify interest-bearing deposits gate (30% threshold)."""

    def test_compliant(self):
        result = screen_interest_deposits(200_000, 1_000_000)
        assert result.status == ComplianceStatus.COMPLIANT

    def test_fail_above_threshold(self):
        result = screen_interest_deposits(400_000, 1_000_000)
        assert result.status == ComplianceStatus.NON_COMPLIANT

    def test_zero_deposits_passes(self):
        result = screen_interest_deposits(0, 1_000_000)
        assert result.status == ComplianceStatus.COMPLIANT


class TestProhibitedIncomeScreening:
    """Verify non-compliant income gate (5% threshold)."""

    def test_compliant(self):
        result = screen_prohibited_income(40_000, 1_000_000)
        assert result.status == ComplianceStatus.COMPLIANT

    def test_compliant_at_threshold(self):
        result = screen_prohibited_income(50_000, 1_000_000)
        assert result.status == ComplianceStatus.COMPLIANT

    def test_fail_above_threshold(self):
        result = screen_prohibited_income(60_000, 1_000_000)
        assert result.status == ComplianceStatus.NON_COMPLIANT
        assert "5%" in result.violations[0].requirement

    def test_fail_zero_income(self):
        result = screen_prohibited_income(10_000, 0)
        assert result.status == ComplianceStatus.NON_COMPLIANT

    def test_zero_prohibited_passes(self):
        result = screen_prohibited_income(0, 1_000_000)
        assert result.status == ComplianceStatus.COMPLIANT
