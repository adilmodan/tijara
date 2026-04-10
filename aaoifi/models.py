"""Pydantic data models for inputs, outputs, and compliance reports."""

from __future__ import annotations

from enum import Enum
from pydantic import BaseModel


class ComplianceStatus(str, Enum):
    COMPLIANT = "COMPLIANT"
    NON_COMPLIANT = "NON-COMPLIANT"


class ProfitBasis(str, Enum):
    PERCENTAGE_OF_PROFIT = "percentage_of_profit"
    FIXED_SUM = "fixed_sum"
    PERCENTAGE_OF_CAPITAL = "percentage_of_capital"


class AssetType(str, Enum):
    BUSINESS = "business"
    AGRICULTURE = "agriculture"


class IrrigationType(str, Enum):
    RAIN_FED = "rain_fed"
    MECHANICAL = "mechanical"


# --- Input Models ---


class CompanyFinancials(BaseModel):
    ticker: str
    sector: str = ""
    industry: str = ""
    market_cap: float = 0.0
    total_debt: float = 0.0
    interest_bearing_deposits: float = 0.0
    prohibited_income: float = 0.0
    total_income: float = 0.0
    cash: float = 0.0
    receivables: float = 0.0
    total_assets: float = 0.0


class ContractInput(BaseModel):
    profit_basis: ProfitBasis
    profit_percentages: list[float] = []
    loss_ratios: list[float] = []
    capital_ratios: list[float] = []


class ZakahInput(BaseModel):
    net_assets: float
    gold_price_per_gram: float
    asset_type: AssetType = AssetType.BUSINESS
    irrigation_type: IrrigationType = IrrigationType.RAIN_FED


# --- Output Models ---


class Violation(BaseModel):
    violated_standard: str
    requirement: str
    input_value: str
    compliance_delta: str


class ScreeningResult(BaseModel):
    status: ComplianceStatus
    violations: list[Violation] = []


class ZakahResult(BaseModel):
    eligible: bool
    nisab_value: float
    net_assets: float
    rate: float
    zakah_due: float


class FullScreeningReport(BaseModel):
    ticker: str
    status: ComplianceStatus
    financials: CompanyFinancials
    qualitative: ScreeningResult
    quantitative: ScreeningResult | None = None
    tangibility: ScreeningResult | None = None
    violations: list[Violation] = []
