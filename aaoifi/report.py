"""
Compliance Violation Report Generator

Formats screening results into the standardized AAOIFI Compliance Violation
Report template. This is the output interface of the engine — all results
pass through this formatter before reaching the caller.

Report format (per specification):
    Status: NON-COMPLIANT
    Violated Standard: [Standard Number]
    Requirement: [Threshold or qualitative rule]
    Input Value: [Actual value provided]
    Compliance Delta: [Numerical difference from threshold]
    Action: TRANSACTION BLOCKED
"""

from aaoifi.models import (
    ComplianceStatus,
    FullScreeningReport,
    ScreeningResult,
    Violation,
    ZakahResult,
)


def format_screening_report(report: FullScreeningReport) -> str:
    """Format a full screening report into the standardized text template.

    Args:
        report: The complete screening report from the orchestrator.

    Returns:
        Formatted multi-line string suitable for display or logging.
    """
    lines: list[str] = []
    lines.append("=" * 72)
    lines.append("AAOIFI SHARI'AH COMPLIANCE REPORT")
    lines.append("=" * 72)
    lines.append(f"Ticker: {report.ticker}")
    lines.append(f"Sector: {report.financials.sector}")
    lines.append(f"Industry: {report.financials.industry}")
    lines.append(f"Market Cap: ${report.financials.market_cap:,.0f}")
    lines.append("-" * 72)

    if report.status == ComplianceStatus.COMPLIANT:
        lines.append("Status: COMPLIANT")
        lines.append("Action: TRANSACTION PERMITTED")
    else:
        lines.append("Status: NON-COMPLIANT")
        lines.append("Action: TRANSACTION BLOCKED")
        lines.append("")
        lines.append("VIOLATIONS:")
        lines.append("-" * 72)
        for i, v in enumerate(report.violations, 1):
            lines.append(f"  [{i}] Violated Standard: {v.violated_standard}")
            lines.append(f"      Requirement:       {v.requirement}")
            lines.append(f"      Input Value:       {v.input_value}")
            lines.append(f"      Compliance Delta:  {v.compliance_delta}")
            lines.append("")

    lines.append("=" * 72)
    return "\n".join(lines)


def format_violation_report(result: ScreeningResult) -> str:
    """Format a single screening result (used for standalone checks).

    Args:
        result: A screening result from any individual module.

    Returns:
        Formatted violation report string, or a simple PASS message.
    """
    if result.status == ComplianceStatus.COMPLIANT:
        return "Status: COMPLIANT\nAction: TRANSACTION PERMITTED"

    lines = ["Status: NON-COMPLIANT", "Action: TRANSACTION BLOCKED", ""]
    for v in result.violations:
        lines.extend(_format_violation(v))
        lines.append("")
    return "\n".join(lines)


def format_zakah_report(result: ZakahResult) -> str:
    """Format a Zakah computation result.

    Args:
        result: The Zakah computation output.

    Returns:
        Formatted string showing Nisab status, rate, and amount due.
    """
    lines: list[str] = []
    lines.append("=" * 72)
    lines.append("ZAKAH COMPUTATION REPORT")
    lines.append("=" * 72)
    lines.append(f"Net Assets:   ${result.net_assets:,.2f}")
    lines.append(f"Nisab Value:  ${result.nisab_value:,.2f} (85g gold)")

    if not result.eligible:
        lines.append("Status:       BELOW NISAB — No Zakah obligation")
        lines.append(f"Shortfall:    ${result.nisab_value - result.net_assets:,.2f}")
    else:
        lines.append("Status:       ABOVE NISAB — Zakah is obligatory")
        lines.append(f"Rate:         {result.rate:.1%}")
        lines.append(f"Zakah Due:    ${result.zakah_due:,.2f}")

    lines.append("=" * 72)
    return "\n".join(lines)


def _format_violation(v: Violation) -> list[str]:
    """Format a single Violation into report lines."""
    return [
        f"Violated Standard: {v.violated_standard}",
        f"Requirement:       {v.requirement}",
        f"Input Value:       {v.input_value}",
        f"Compliance Delta:  {v.compliance_delta}",
    ]
