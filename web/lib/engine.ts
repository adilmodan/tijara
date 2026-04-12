/**
 * Screening Engine — Full AAOIFI compliance pipeline in TypeScript
 * Mirrors the Python aaoifi package logic for client/server-side execution.
 */

import {
  DEBT_THRESHOLD,
  INTEREST_DEPOSIT_THRESHOLD,
  PROHIBITED_INCOME_CAP,
  MIN_TANGIBILITY,
  GOLD_NISAB_GRAMS,
  ZAKAH_RATE_BUSINESS,
  ZAKAH_RATE_RAIN_FED,
  ZAKAH_RATE_MECHANICAL,
  PROHIBITED_SECTOR_KEYWORDS,
  PROHIBITED_INDUSTRY_KEYWORDS,
} from './constants'

import type {
  ComplianceStatus,
  Violation,
  ScreeningResult,
  CompanyFinancials,
  FullScreeningReport,
  ContractInput,
  ZakahInput,
  ZakahResult,
} from './types'

// ─── Module I: Qualitative Sector Screening ─────────────────────────

export function screenSector(sector: string, industry: string): ScreeningResult {
  const sectorLower = sector.toLowerCase()
  const industryLower = industry.toLowerCase()

  if (PROHIBITED_INDUSTRY_KEYWORDS.includes(industryLower)) {
    return sectorFail(sector, industry, `Industry '${industry}' is prohibited`)
  }

  for (const keyword of PROHIBITED_SECTOR_KEYWORDS) {
    if (sectorLower.includes(keyword) || industryLower.includes(keyword)) {
      return sectorFail(sector, industry, `Keyword '${keyword}' matched in sector/industry`)
    }
  }

  return { status: 'COMPLIANT', violations: [] }
}

function sectorFail(sector: string, industry: string, reason: string): ScreeningResult {
  return {
    status: 'NON-COMPLIANT',
    violations: [{
      violated_standard: 'SS (21)',
      requirement: 'Company must not operate in a prohibited sector (Conventional Finance, Alcohol, Pork, Gambling)',
      input_value: `Sector='${sector}', Industry='${industry}'`,
      compliance_delta: reason,
    }],
  }
}

// ─── Module II: Quantitative Screening ──────────────────────────────

function screenRatio(
  numerator: number,
  denominator: number,
  threshold: number,
  metricName: string,
  denominatorName: string,
): ScreeningResult {
  if (denominator <= 0) {
    return {
      status: 'NON-COMPLIANT',
      violations: [{
        violated_standard: 'SS (21)',
        requirement: `${metricName} screening requires positive ${denominatorName}`,
        input_value: `${denominatorName} <= 0`,
        compliance_delta: 'Cannot compute ratio — denominator is non-positive',
      }],
    }
  }

  const ratio = numerator / denominator
  if (ratio > threshold) {
    return {
      status: 'NON-COMPLIANT',
      violations: [{
        violated_standard: 'SS (21)',
        requirement: `${metricName} <= ${(threshold * 100).toFixed(0)}%`,
        input_value: `${(ratio * 100).toFixed(2)}%`,
        compliance_delta: `+${((ratio - threshold) * 100).toFixed(2)}% above threshold`,
      }],
    }
  }

  return { status: 'COMPLIANT', violations: [] }
}

export function screenDebt(totalDebt: number, marketCap: number): ScreeningResult {
  return screenRatio(totalDebt, marketCap, DEBT_THRESHOLD, 'Total Debt / Market Cap', 'Market Capitalization')
}

export function screenInterestDeposits(deposits: number, marketCap: number): ScreeningResult {
  return screenRatio(deposits, marketCap, INTEREST_DEPOSIT_THRESHOLD, 'Interest Deposits / Market Cap', 'Market Capitalization')
}

export function screenProhibitedIncome(prohibited: number, totalIncome: number): ScreeningResult {
  return screenRatio(prohibited, totalIncome, PROHIBITED_INCOME_CAP, 'Prohibited Income / Total Income', 'Total Income')
}

// ─── Module III: Tangibility ────────────────────────────────────────

export function screenTangibility(cash: number, receivables: number, totalAssets: number): ScreeningResult {
  if (totalAssets <= 0) {
    return {
      status: 'NON-COMPLIANT',
      violations: [{
        violated_standard: 'SS (21)',
        requirement: 'Tangibility screening requires positive Total Assets',
        input_value: 'Total Assets <= 0',
        compliance_delta: 'Cannot compute ratio — denominator is non-positive',
      }],
    }
  }

  const tangibleRatio = 1 - (cash + receivables) / totalAssets
  if (tangibleRatio < MIN_TANGIBILITY) {
    return {
      status: 'NON-COMPLIANT',
      violations: [{
        violated_standard: 'SS (21)',
        requirement: `Tangible Assets / Total Assets >= ${(MIN_TANGIBILITY * 100).toFixed(0)}%`,
        input_value: `${(tangibleRatio * 100).toFixed(2)}%`,
        compliance_delta: `-${((MIN_TANGIBILITY - tangibleRatio) * 100).toFixed(2)}% below threshold`,
      }],
    }
  }

  return { status: 'COMPLIANT', violations: [] }
}

// ─── Full Stock Screening Pipeline ──────────────────────────────────

export function screenFinancials(financials: CompanyFinancials): FullScreeningReport {
  const allViolations: Violation[] = []

  // Module I: Qualitative (hard stop)
  const qualResult = screenSector(financials.sector, financials.industry)
  if (qualResult.status === 'NON-COMPLIANT') {
    return {
      ticker: financials.ticker,
      status: 'NON-COMPLIANT',
      financials,
      qualitative: qualResult,
      quantitative: null,
      tangibility: null,
      violations: qualResult.violations,
    }
  }

  // Module II: Quantitative
  const quantViolations: Violation[] = []
  quantViolations.push(...screenDebt(financials.total_debt, financials.market_cap).violations)
  quantViolations.push(...screenInterestDeposits(financials.interest_bearing_deposits, financials.market_cap).violations)
  if (financials.total_income > 0) {
    quantViolations.push(...screenProhibitedIncome(financials.prohibited_income, financials.total_income).violations)
  }
  const quantResult: ScreeningResult = {
    status: quantViolations.length > 0 ? 'NON-COMPLIANT' : 'COMPLIANT',
    violations: quantViolations,
  }
  allViolations.push(...quantViolations)

  // Module III: Tangibility
  const tangResult = screenTangibility(financials.cash, financials.receivables, financials.total_assets)
  allViolations.push(...tangResult.violations)

  return {
    ticker: financials.ticker,
    status: allViolations.length > 0 ? 'NON-COMPLIANT' : 'COMPLIANT',
    financials,
    qualitative: qualResult,
    quantitative: quantResult,
    tangibility: tangResult,
    violations: allViolations,
  }
}

// ─── Module V: Contractual Validation ───────────────────────────────

export function validateContract(contract: ContractInput): ScreeningResult {
  const violations: Violation[] = []

  // Profit basis check
  if (contract.profit_basis === 'fixed_sum' || contract.profit_basis === 'percentage_of_capital') {
    violations.push({
      violated_standard: 'SS (12) / SS (13)',
      requirement: 'Profit must be an undivided percentage of actual net profit',
      input_value: `profit_basis='${contract.profit_basis}'`,
      compliance_delta: `'${contract.profit_basis}' is prohibited — only 'percentage_of_profit' is permitted`,
    })
  }

  // Loss distribution check
  if (contract.loss_ratios.length > 0 && contract.capital_ratios.length > 0) {
    if (contract.loss_ratios.length !== contract.capital_ratios.length) {
      violations.push({
        violated_standard: 'SS (12)',
        requirement: 'Each partner must have both a loss ratio and capital ratio',
        input_value: `loss_ratios(${contract.loss_ratios.length}) != capital_ratios(${contract.capital_ratios.length})`,
        compliance_delta: 'Mismatched partner count',
      })
    } else {
      contract.loss_ratios.forEach((loss, i) => {
        const capital = contract.capital_ratios[i]
        if (Math.abs(loss - capital) > 1e-9) {
          violations.push({
            violated_standard: 'SS (12)',
            requirement: `Partner ${i + 1} loss ratio must equal capital contribution ratio`,
            input_value: `loss_ratio=${loss.toFixed(4)}, capital_ratio=${capital.toFixed(4)}`,
            compliance_delta: `Delta: ${Math.abs(loss - capital).toFixed(4)}`,
          })
        }
      })
    }
  }

  return {
    status: violations.length > 0 ? 'NON-COMPLIANT' : 'COMPLIANT',
    violations,
  }
}

// ─── Module IV: Zakah Computation ───────────────────────────────────

export function computeZakah(input: ZakahInput): ZakahResult {
  const goldValue = input.gold_weight_grams * input.gold_price_per_gram
  const silverValue = input.silver_weight_grams * input.silver_price_per_gram
  const netAssets = input.liquid_assets + goldValue + silverValue

  const nisabValue = GOLD_NISAB_GRAMS * input.gold_price_per_gram

  if (netAssets < nisabValue) {
    return {
      eligible: false, nisab_value: nisabValue, net_assets: netAssets,
      liquid_assets: input.liquid_assets, gold_value: goldValue, silver_value: silverValue,
      rate: 0, zakah_due: 0,
    }
  }

  let rate: number
  if (input.asset_type === 'business') {
    rate = ZAKAH_RATE_BUSINESS
  } else {
    rate = input.irrigation_type === 'rain_fed' ? ZAKAH_RATE_RAIN_FED : ZAKAH_RATE_MECHANICAL
  }

  return {
    eligible: true, nisab_value: nisabValue, net_assets: netAssets,
    liquid_assets: input.liquid_assets, gold_value: goldValue, silver_value: silverValue,
    rate, zakah_due: rate * netAssets,
  }
}
