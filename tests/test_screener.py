"""Tests for the Screener orchestration layer."""

from aaoifi.models import (
    CompanyFinancials,
    ComplianceStatus,
    ContractInput,
    ProfitBasis,
)
from aaoifi.screener import screen_contract, screen_financials


class TestScreenFinancials:
    """Verify end-to-end screening pipeline with pre-built financials."""

    def _make_compliant_financials(self) -> CompanyFinancials:
        """Build a baseline compliant CompanyFinancials."""
        return CompanyFinancials(
            ticker="TEST",
            sector="Technology",
            industry="Software—Application",
            market_cap=1_000_000,
            total_debt=100_000,          # 10% < 30%
            interest_bearing_deposits=0,
            prohibited_income=0,
            total_income=500_000,
            cash=200_000,
            receivables=100_000,         # Monetary=30%, Tangible=70%
            total_assets=1_000_000,
        )

    def test_compliant_stock(self):
        result = screen_financials(self._make_compliant_financials())
        assert result.status == ComplianceStatus.COMPLIANT
        assert result.violations == []

    def test_qualitative_fail_short_circuits(self):
        """Prohibited sector should block without running quantitative checks."""
        financials = self._make_compliant_financials()
        financials.sector = "Financial Services"
        financials.industry = "Diversified Banks"

        result = screen_financials(financials)
        assert result.status == ComplianceStatus.NON_COMPLIANT
        assert result.quantitative is None  # Never executed
        assert result.tangibility is None

    def test_debt_ratio_fail(self):
        financials = self._make_compliant_financials()
        financials.total_debt = 400_000  # 40% > 30%

        result = screen_financials(financials)
        assert result.status == ComplianceStatus.NON_COMPLIANT
        assert any("Debt" in v.requirement for v in result.violations)

    def test_tangibility_fail(self):
        financials = self._make_compliant_financials()
        financials.cash = 600_000
        financials.receivables = 200_000  # Monetary=80%, Tangible=20%

        result = screen_financials(financials)
        assert result.status == ComplianceStatus.NON_COMPLIANT
        assert any("Tangible" in v.requirement for v in result.violations)

    def test_multiple_violations_reported(self):
        financials = self._make_compliant_financials()
        financials.total_debt = 400_000   # Debt fail
        financials.cash = 600_000
        financials.receivables = 200_000  # Tangibility fail

        result = screen_financials(financials)
        assert result.status == ComplianceStatus.NON_COMPLIANT
        assert len(result.violations) >= 2


class TestScreenContract:
    """Verify contract screening entry point."""

    def test_compliant_contract(self):
        contract = ContractInput(
            profit_basis=ProfitBasis.PERCENTAGE_OF_PROFIT,
            loss_ratios=[0.5, 0.5],
            capital_ratios=[0.5, 0.5],
        )
        result = screen_contract(contract)
        assert result.status == ComplianceStatus.COMPLIANT

    def test_non_compliant_contract(self):
        contract = ContractInput(
            profit_basis=ProfitBasis.FIXED_SUM,
            loss_ratios=[0.5, 0.5],
            capital_ratios=[0.5, 0.5],
        )
        result = screen_contract(contract)
        assert result.status == ComplianceStatus.NON_COMPLIANT
