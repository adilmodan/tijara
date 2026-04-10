"""
Module V: Contractual and Distribution Logic

Implements validation rules for Islamic partnership contracts per AAOIFI
Shari'ah Standards SS (12) Sharikah (Musharakah) and SS (13) Mudarabah.

Core Shari'ah rules enforced:

1. Profit Distribution (SS 12/13):
   - Profit must be expressed as an undivided percentage of actual net profit.
   - A fixed lump sum or a percentage of capital contribution is PROHIBITED,
     because it shifts the nature of the contract from a profit-sharing
     partnership to a guaranteed-return instrument (resembling Riba).

2. Loss Distribution (SS 12):
   - Financial losses must be borne strictly in proportion to each partner's
     capital contribution ratio. Any deviation violates the Musharakah structure
     and is treated as an unjust condition (Gharar).

Reference: AAOIFI Shari'ah Standards (2017 Edition), Standards 12 & 13
"""

import math

from aaoifi.models import (
    ComplianceStatus,
    ContractInput,
    ProfitBasis,
    ScreeningResult,
    Violation,
)


def validate_contract(contract: ContractInput) -> ScreeningResult:
    """Run all contractual validation checks on a Musharakah/Mudarabah contract.

    This is the top-level entry point that composes profit and loss validation.
    Any single failure renders the contract non-compliant.

    Args:
        contract: The partnership contract parameters to validate.

    Returns:
        ScreeningResult aggregating all violations found, if any.
    """
    violations: list[Violation] = []

    profit_result = validate_profit_distribution(contract.profit_basis)
    violations.extend(profit_result.violations)

    if contract.loss_ratios and contract.capital_ratios:
        loss_result = validate_loss_distribution(
            contract.loss_ratios, contract.capital_ratios
        )
        violations.extend(loss_result.violations)

    if violations:
        return ScreeningResult(
            status=ComplianceStatus.NON_COMPLIANT,
            violations=violations,
        )
    return ScreeningResult(status=ComplianceStatus.COMPLIANT)


def validate_profit_distribution(profit_basis: ProfitBasis) -> ScreeningResult:
    """Validate that the profit distribution basis complies with SS (12) / SS (13).

    The only compliant basis is an undivided percentage of actual net profit.
    Fixed sums and percentages of capital are explicitly prohibited.

    Args:
        profit_basis: How profit is allocated — must be PERCENTAGE_OF_PROFIT.

    Returns:
        ScreeningResult — COMPLIANT if percentage-of-profit,
        NON_COMPLIANT for fixed_sum or percentage_of_capital.
    """
    if profit_basis in (ProfitBasis.FIXED_SUM, ProfitBasis.PERCENTAGE_OF_CAPITAL):
        return ScreeningResult(
            status=ComplianceStatus.NON_COMPLIANT,
            violations=[
                Violation(
                    violated_standard="SS (12) / SS (13)",
                    requirement="Profit must be an undivided percentage of actual net profit",
                    input_value=f"profit_basis='{profit_basis.value}'",
                    compliance_delta=f"'{profit_basis.value}' is prohibited — "
                                     "only 'percentage_of_profit' is permitted",
                )
            ],
        )
    return ScreeningResult(status=ComplianceStatus.COMPLIANT)


def validate_loss_distribution(
    loss_ratios: list[float], capital_ratios: list[float]
) -> ScreeningResult:
    """Validate that loss distribution matches capital contribution ratios per SS (12).

    In a Musharakah, each partner's share of financial loss MUST equal their
    share of capital contribution. Any deviation is non-compliant.

    Args:
        loss_ratios: Each partner's agreed loss-bearing ratio (must sum to ~1.0).
        capital_ratios: Each partner's capital contribution ratio (must sum to ~1.0).

    Returns:
        ScreeningResult — COMPLIANT if loss_ratios == capital_ratios for all partners,
        NON_COMPLIANT if any partner's loss ratio deviates from their capital ratio.
    """
    if len(loss_ratios) != len(capital_ratios):
        return ScreeningResult(
            status=ComplianceStatus.NON_COMPLIANT,
            violations=[
                Violation(
                    violated_standard="SS (12)",
                    requirement="Each partner must have both a loss ratio and capital ratio",
                    input_value=f"loss_ratios({len(loss_ratios)}) != capital_ratios({len(capital_ratios)})",
                    compliance_delta="Mismatched partner count",
                )
            ],
        )

    violations: list[Violation] = []
    for i, (loss, capital) in enumerate(zip(loss_ratios, capital_ratios)):
        if not math.isclose(loss, capital, rel_tol=1e-9):
            violations.append(
                Violation(
                    violated_standard="SS (12)",
                    requirement=f"Partner {i+1} loss ratio must equal capital contribution ratio",
                    input_value=f"loss_ratio={loss:.4f}, capital_ratio={capital:.4f}",
                    compliance_delta=f"Delta: {abs(loss - capital):.4f}",
                )
            )

    if violations:
        return ScreeningResult(
            status=ComplianceStatus.NON_COMPLIANT, violations=violations
        )
    return ScreeningResult(status=ComplianceStatus.COMPLIANT)
