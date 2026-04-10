/**
 * AAOIFI Shari'ah Standards — Type Definitions
 *
 * Core data models for the compliance engine, mirroring the Python
 * package's Pydantic models for full-stack type safety.
 */

export type ComplianceStatus = 'COMPLIANT' | 'NON-COMPLIANT'

export type ProfitBasis = 'percentage_of_profit' | 'fixed_sum' | 'percentage_of_capital'
export type AssetType = 'business' | 'agriculture'
export type IrrigationType = 'rain_fed' | 'mechanical'

export interface Violation {
  violated_standard: string
  requirement: string
  input_value: string
  compliance_delta: string
}

export interface ScreeningResult {
  status: ComplianceStatus
  violations: Violation[]
}

export interface CompanyFinancials {
  ticker: string
  sector: string
  industry: string
  market_cap: number
  total_debt: number
  interest_bearing_deposits: number
  prohibited_income: number
  prohibited_income_source: string
  total_income: number
  cash: number
  receivables: number
  total_assets: number
}

export interface FullScreeningReport {
  ticker: string
  status: ComplianceStatus
  financials: CompanyFinancials
  qualitative: ScreeningResult
  quantitative: ScreeningResult | null
  tangibility: ScreeningResult | null
  violations: Violation[]
}

export interface ContractInput {
  profit_basis: ProfitBasis
  loss_ratios: number[]
  capital_ratios: number[]
}

export interface ZakahInput {
  liquid_assets: number
  gold_weight_grams: number
  silver_weight_grams: number
  gold_price_per_gram: number
  silver_price_per_gram: number
  asset_type: AssetType
  irrigation_type: IrrigationType
}

export interface ZakahResult {
  eligible: boolean
  nisab_value: number
  net_assets: number
  liquid_assets: number
  gold_value: number
  silver_value: number
  rate: number
  zakah_due: number
}
