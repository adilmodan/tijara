/**
 * AAOIFI Shari'ah Standards — System Constants
 * Reference: AAOIFI Shari'ah Standards (2017 Edition)
 */

// Nisab threshold per SS (35)
export const GOLD_NISAB_GRAMS = 85

// Quantitative screening thresholds per SS (21)
export const DEBT_THRESHOLD = 0.30
export const INTEREST_DEPOSIT_THRESHOLD = 0.30
export const PROHIBITED_INCOME_CAP = 0.05
export const MIN_TANGIBILITY = 0.30

// Zakah rates per SS (35) and SS (50)
export const ZAKAH_RATE_BUSINESS = 0.025
export const ZAKAH_RATE_RAIN_FED = 0.10
export const ZAKAH_RATE_MECHANICAL = 0.05

// Prohibited sector keywords per SS (21)
export const PROHIBITED_SECTOR_KEYWORDS: string[] = [
  'bank', 'banking', 'insurance', 'mortgage', 'lending',
  'credit', 'consumer finance', 'asset management',
  'capital markets', 'financial services',
  'alcohol', 'liquor', 'beer', 'wine', 'spirits',
  'distiller', 'brewer', 'brewery', 'winery',
  'pork', 'swine', 'ham', 'bacon',
  'casino', 'gambling', 'gaming', 'lottery', 'betting',
  'slot', 'wagering',
]

export const PROHIBITED_INDUSTRY_KEYWORDS: string[] = [
  'banks', 'diversified banks', 'regional banks',
  'thrifts & mortgage finance',
  'consumer finance', 'asset management & custody banks',
  'investment banking & brokerage',
  'insurance', 'life & health insurance',
  'property & casualty insurance', 'reinsurance',
  'multi-line insurance',
  'brewers', 'distillers & vintners',
  'casinos & gaming',
  'tobacco',
]
