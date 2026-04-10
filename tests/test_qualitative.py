"""Tests for Module I: Qualitative Sector Screening."""

from aaoifi.models import ComplianceStatus
from aaoifi.qualitative import screen_sector


class TestSectorScreening:
    """Verify binary sector filter against AAOIFI prohibition list."""

    def test_compliant_technology_sector(self):
        result = screen_sector("Technology", "Software—Application")
        assert result.status == ComplianceStatus.COMPLIANT
        assert result.violations == []

    def test_compliant_healthcare_sector(self):
        result = screen_sector("Healthcare", "Drug Manufacturers—General")
        assert result.status == ComplianceStatus.COMPLIANT

    def test_fail_conventional_banking(self):
        result = screen_sector("Financial Services", "Diversified Banks")
        assert result.status == ComplianceStatus.NON_COMPLIANT
        assert len(result.violations) == 1
        assert "SS (21)" in result.violations[0].violated_standard

    def test_fail_insurance(self):
        result = screen_sector("Financial Services", "Life & Health Insurance")
        assert result.status == ComplianceStatus.NON_COMPLIANT

    def test_fail_alcohol_industry(self):
        result = screen_sector("Consumer Defensive", "Brewers")
        assert result.status == ComplianceStatus.NON_COMPLIANT

    def test_fail_alcohol_keyword_in_sector(self):
        result = screen_sector("Liquor Distribution", "Beverages")
        assert result.status == ComplianceStatus.NON_COMPLIANT

    def test_fail_pork_related(self):
        result = screen_sector("Consumer Staples", "Pork Processing")
        assert result.status == ComplianceStatus.NON_COMPLIANT

    def test_fail_gambling(self):
        result = screen_sector("Consumer Cyclical", "Casinos & Gaming")
        assert result.status == ComplianceStatus.NON_COMPLIANT

    def test_fail_casino_keyword(self):
        result = screen_sector("Entertainment", "Casino Operations")
        assert result.status == ComplianceStatus.NON_COMPLIANT

    def test_empty_strings_pass(self):
        result = screen_sector("", "")
        assert result.status == ComplianceStatus.COMPLIANT

    def test_case_insensitive_matching(self):
        result = screen_sector("FINANCIAL SERVICES", "DIVERSIFIED BANKS")
        assert result.status == ComplianceStatus.NON_COMPLIANT
