"""Tests for Module V: Contractual Validation (Musharakah / Mudarabah)."""

from aaoifi.contractual import (
    validate_contract,
    validate_loss_distribution,
    validate_profit_distribution,
)
from aaoifi.models import ComplianceStatus, ContractInput, ProfitBasis


class TestProfitDistribution:
    """Verify profit basis validation per SS (12) / SS (13)."""

    def test_compliant_percentage_of_profit(self):
        result = validate_profit_distribution(ProfitBasis.PERCENTAGE_OF_PROFIT)
        assert result.status == ComplianceStatus.COMPLIANT

    def test_fail_fixed_sum(self):
        result = validate_profit_distribution(ProfitBasis.FIXED_SUM)
        assert result.status == ComplianceStatus.NON_COMPLIANT
        assert "SS (12)" in result.violations[0].violated_standard

    def test_fail_percentage_of_capital(self):
        result = validate_profit_distribution(ProfitBasis.PERCENTAGE_OF_CAPITAL)
        assert result.status == ComplianceStatus.NON_COMPLIANT


class TestLossDistribution:
    """Verify loss-to-capital ratio matching per SS (12)."""

    def test_compliant_matching_ratios(self):
        result = validate_loss_distribution([0.5, 0.5], [0.5, 0.5])
        assert result.status == ComplianceStatus.COMPLIANT

    def test_compliant_three_partners(self):
        result = validate_loss_distribution([0.3, 0.3, 0.4], [0.3, 0.3, 0.4])
        assert result.status == ComplianceStatus.COMPLIANT

    def test_fail_mismatched_ratios(self):
        result = validate_loss_distribution([0.6, 0.4], [0.5, 0.5])
        assert result.status == ComplianceStatus.NON_COMPLIANT

    def test_fail_unequal_list_lengths(self):
        result = validate_loss_distribution([0.5, 0.5], [0.33, 0.33, 0.34])
        assert result.status == ComplianceStatus.NON_COMPLIANT


class TestContractValidation:
    """Verify the composite contract validation entry point."""

    def test_compliant_full_contract(self):
        contract = ContractInput(
            profit_basis=ProfitBasis.PERCENTAGE_OF_PROFIT,
            loss_ratios=[0.6, 0.4],
            capital_ratios=[0.6, 0.4],
        )
        result = validate_contract(contract)
        assert result.status == ComplianceStatus.COMPLIANT

    def test_fail_profit_basis(self):
        contract = ContractInput(
            profit_basis=ProfitBasis.FIXED_SUM,
            loss_ratios=[0.5, 0.5],
            capital_ratios=[0.5, 0.5],
        )
        result = validate_contract(contract)
        assert result.status == ComplianceStatus.NON_COMPLIANT

    def test_fail_both_violations(self):
        contract = ContractInput(
            profit_basis=ProfitBasis.FIXED_SUM,
            loss_ratios=[0.7, 0.3],
            capital_ratios=[0.5, 0.5],
        )
        result = validate_contract(contract)
        assert result.status == ComplianceStatus.NON_COMPLIANT
        assert len(result.violations) >= 2  # profit + loss violations

    def test_profit_only_validation(self):
        """Contract with no loss/capital ratios — only profit basis checked."""
        contract = ContractInput(
            profit_basis=ProfitBasis.PERCENTAGE_OF_PROFIT,
        )
        result = validate_contract(contract)
        assert result.status == ComplianceStatus.COMPLIANT
