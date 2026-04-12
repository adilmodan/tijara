import { NextResponse } from 'next/server'
import { screenFinancials } from '@/lib/engine'
import { supabase } from '@/lib/supabase'
import type { CompanyFinancials, Violation } from '@/lib/types'

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
]

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

// ─── Crumb Cache ─────────────────────────────────────────────────────
let crumbCache: { crumb: string; cookie: string; ua: string; ts: number } | null = null
let crumbInflight: Promise<{ crumb: string; cookie: string; ua: string }> | null = null
const TTL = 10 * 60_000

async function fetchCrumb(): Promise<{ crumb: string; cookie: string; ua: string }> {
  const hosts = ['query2.finance.yahoo.com', 'query1.finance.yahoo.com']
  for (let attempt = 0; attempt < 3; attempt++) {
    const ua = randomUA()
    try {
      const consent = await fetch('https://fc.yahoo.com', {
        headers: { 'User-Agent': ua },
        redirect: 'manual',
      })
      const cookies = consent.headers.get('set-cookie')
      if (!cookies) continue

      const host = hosts[attempt % hosts.length]
      const crumbRes = await fetch(
        `https://${host}/v1/test/getcrumb`,
        { headers: { 'User-Agent': ua, Cookie: cookies } },
      )

      if (crumbRes.status === 429) {
        await new Promise(r => setTimeout(r, 1000 + attempt * 1000))
        continue
      }

      if (!crumbRes.ok) continue

      const crumb = await crumbRes.text()
      if (crumb && crumb.length > 3 && !crumb.includes('<')) {
        crumbCache = { crumb, cookie: cookies, ua, ts: Date.now() }
        return crumbCache
      }
    } catch {
      continue
    }
  }

  throw new Error('Yahoo Finance is temporarily unavailable. Please wait a moment and try again.')
}

// Deduplicates concurrent calls — multiple requests share a single in-flight fetch
function getCrumb(): Promise<{ crumb: string; cookie: string; ua: string }> {
  if (crumbCache && Date.now() - crumbCache.ts < TTL) {
    return Promise.resolve(crumbCache)
  }
  if (!crumbInflight) {
    crumbInflight = fetchCrumb().finally(() => { crumbInflight = null })
  }
  return crumbInflight
}

// Warm the crumb cache on module load so the first user request doesn't wait
getCrumb().catch(() => {})

// ─── Data Fetching ───────────────────────────────────────────────────

const TIMESERIES_FIELDS = [
  'annualTotalAssets', 'annualAccountsReceivable', 'annualNetReceivables',
  'annualCashAndCashEquivalents', 'annualTotalDebt', 'annualTotalRevenue',
  'quarterlyTotalAssets', 'quarterlyAccountsReceivable',
  'annualOtherShortTermInvestments', 'annualShortTermInvestments',
  'annualLongTermInvestments', 'annualInvestmentsAndAdvances',
  'annualInterestIncome', 'annualInterestIncomeNonOperating',
  'annualNetInterestIncome', 'annualNetNonOperatingInterestIncomeExpense',
  'annualInterestExpense',
]

const TIMESERIES_TYPE_PARAM = TIMESERIES_FIELDS.join(',')

function quoteSummaryUrl(ticker: string, crumb: string): string {
  return `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=assetProfile,financialData,incomeStatementHistory,price&crumb=${encodeURIComponent(crumb)}`
}

function timeseriesUrl(ticker: string, crumb: string): string {
  return `https://query2.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(ticker)}?type=${TIMESERIES_TYPE_PARAM}&period1=0&period2=${Math.floor(Date.now() / 1000)}&crumb=${encodeURIComponent(crumb)}`
}

function priceOnlyUrl(ticker: string, crumb: string): string {
  return `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=price&crumb=${encodeURIComponent(crumb)}`
}

async function fetchData(ticker: string) {
  const { crumb, cookie, ua } = await getCrumb()
  // Reuse the same UA that obtained the crumb — Yahoo correlates UA + cookie
  const headers = { 'User-Agent': ua, Cookie: cookie }

  const [sumRes, tsRes] = await Promise.all([
    fetch(quoteSummaryUrl(ticker, crumb), { headers }),
    fetch(timeseriesUrl(ticker, crumb), { headers }),
  ])

  // If rate limited, single retry on the alternate host after a pause
  let finalSumRes = sumRes
  let finalTsRes = tsRes
  if (sumRes.status === 429 || tsRes.status === 429) {
    await new Promise(r => setTimeout(r, 1500))
    const retries = await Promise.all([
      sumRes.status === 429
        ? fetch(quoteSummaryUrl(ticker, crumb).replace('query2', 'query1'), { headers })
        : Promise.resolve(sumRes),
      tsRes.status === 429
        ? fetch(timeseriesUrl(ticker, crumb).replace('query2', 'query1'), { headers })
        : Promise.resolve(tsRes),
    ])
    finalSumRes = retries[0]
    finalTsRes = retries[1]
  }

  let summary: Record<string, any> | null = null
  if (finalSumRes.ok) {
    const data = await finalSumRes.json()
    summary = data?.quoteSummary?.result?.[0] || null
  }

  const ts: Record<string, number> = {}
  if (finalTsRes.ok) {
    const json = await finalTsRes.json()
    for (const r of json?.timeseries?.result || []) {
      const key = r.meta?.type?.[0]
      const vals = r[key]
      if (key && vals?.length > 0) {
        const latest = vals[vals.length - 1]
        if (latest?.reportedValue?.raw != null) {
          ts[key] = latest.reportedValue.raw
        }
      }
    }
  }

  return { summary, ts }
}

// ─── Tier 2: Lightweight price-only fetch ───────────────────────────

interface PriceData {
  marketCap: number
}

async function fetchPriceData(ticker: string): Promise<PriceData | null> {
  try {
    const { crumb, cookie, ua } = await getCrumb()
    const headers = { 'User-Agent': ua, Cookie: cookie }
    let res = await fetch(priceOnlyUrl(ticker, crumb), { headers })

    if (res.status === 429) {
      await new Promise(r => setTimeout(r, 1500))
      res = await fetch(priceOnlyUrl(ticker, crumb).replace('query2', 'query1'), { headers })
    }

    if (!res.ok) return null
    const json = await res.json()
    const price = json?.quoteSummary?.result?.[0]?.price
    if (!price) return null

    return {
      marketCap: price.marketCap?.raw ?? 0,
    }
  } catch {
    return null
  }
}

// ─── Cache Helpers ──────────────────────────────────────────────────

// Tier 1: Hot cache — 24 hour TTL
const CACHE_TTL_HOURS = 24

async function getCachedReport(ticker: string) {
  if (!supabase) return null
  const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('screening_cache')
    .select('report')
    .eq('ticker', ticker)
    .gte('cached_at', cutoff)
    .single()
  return data?.report ?? null
}

async function cacheReport(ticker: string, report: Record<string, unknown>, financials: Record<string, unknown>) {
  if (!supabase) return
  await supabase.from('screening_cache').upsert(
    { ticker, report, financials, cached_at: new Date().toISOString() },
    { onConflict: 'ticker' },
  )
}

// Tier 2: Stock screenings DB lookup

interface StockScreeningRow {
  ticker: string
  status: string
  sector: string | null
  industry: string | null
  violations: Violation[] | null
  raw_financials: {
    market_cap: number
    total_debt: number
    interest_bearing_deposits: number
    prohibited_income: number
    total_income: number
    cash: number
    receivables: number
    total_assets: number
  } | null
  screened_at: string
}

const SCREENING_SELECT = 'ticker, status, sector, industry, violations, raw_financials, screened_at'

async function getStockScreening(ticker: string): Promise<StockScreeningRow | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('stock_screenings')
    .select(SCREENING_SELECT)
    .eq('ticker', ticker)
    .neq('status', 'error')
    .single()
  return (data as StockScreeningRow | null) ?? null
}

function reconstructFromDb(row: StockScreeningRow, priceData: PriceData | null) {
  const rf = row.raw_financials!
  // Use live market cap if available, otherwise fall back to DB value
  const liveMarketCap = priceData?.marketCap || rf.market_cap

  const financials: CompanyFinancials = {
    ticker: row.ticker,
    sector: row.sector ?? '',
    industry: row.industry ?? '',
    market_cap: liveMarketCap,
    total_debt: rf.total_debt,
    interest_bearing_deposits: rf.interest_bearing_deposits,
    prohibited_income: rf.prohibited_income,
    prohibited_income_source: '',
    total_income: rf.total_income,
    cash: rf.cash,
    receivables: rf.receivables,
    total_assets: rf.total_assets,
  }

  // Re-run screening engine with live market cap so ratios are current
  return screenFinancials(financials)
}

// ─── Route Handler ───────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ticker, manual, fast } = body

    let financials: CompanyFinancials

    if (manual) {
      financials = body.financials as CompanyFinancials
    } else {
      const upperTicker = ticker.toUpperCase()

      // ── Tier 1: Hot cache (< 24h) ──
      const cached = await getCachedReport(upperTicker)
      if (cached) {
        console.log(`[screen] ${upperTicker} → Tier 1 (hot cache)`)
        return NextResponse.json({ ...cached, cached: true })
      }

      // ── Tier 2: Stock screenings DB + live price ──
      const screening = await getStockScreening(upperTicker)
      if (screening?.raw_financials && screening.raw_financials.total_assets > 0) {
        console.log(`[screen] ${upperTicker} → Tier 2 (DB${fast ? ', no live price' : ' + live price'})`)
        const priceData = fast ? null : await fetchPriceData(upperTicker)
        const report = reconstructFromDb(screening, priceData)

        // Write back to Tier 1 hot cache (skip for fast mode — stale market cap)
        if (!fast) {
          cacheReport(
            upperTicker,
            report as unknown as Record<string, unknown>,
            report.financials as unknown as Record<string, unknown>,
          ).catch(() => {})
        }

        return NextResponse.json({ ...report, screened_at: screening.screened_at })
      }

      // ── Fast mode: no Tier 3 fallback ──
      if (fast) {
        throw new Error(`'${upperTicker}' is not available in fast mode. Try the main screener.`)
      }

      // ── Tier 3: Full Yahoo Finance fetch ──
      console.log(`[screen] ${upperTicker} → Tier 3 (full Yahoo fetch)`)
      let result: { summary: Record<string, any> | null; ts: Record<string, number> }

      try {
        result = await fetchData(ticker.toUpperCase())
      } catch (fetchErr: unknown) {
        // If crumb auth failed, invalidate cache so the NEXT request gets a fresh one.
        // Don't retry immediately — that doubles request volume and worsens rate limiting.
        crumbCache = null
        throw fetchErr
      }

      const { summary, ts } = result

      if (!summary && Object.keys(ts).length === 0) {
        throw new Error(`Unable to fetch data for '${ticker}'. Please try again or use Manual Input.`)
      }

      const fd = summary?.financialData || {}
      const sector = summary?.assetProfile?.sector || ''
      const industry = summary?.assetProfile?.industry || ''
      const marketCap = summary?.price?.marketCap?.raw || fd?.marketCap?.raw || 0

      const totalDebt = ts.annualTotalDebt || fd?.totalDebt?.raw || 0
      const cash = ts.annualCashAndCashEquivalents || fd?.totalCash?.raw || 0
      const totalAssets = ts.annualTotalAssets || ts.quarterlyTotalAssets || 0
      const receivables = ts.annualAccountsReceivable || ts.annualNetReceivables || ts.quarterlyAccountsReceivable || 0

      // Yahoo doesn't report interest-bearing deposits directly;
      // proxy via short-term + long-term investment securities
      const interestBearingDeposits =
        (ts.annualOtherShortTermInvestments || ts.annualShortTermInvestments || 0) +
        (ts.annualLongTermInvestments || ts.annualInvestmentsAndAdvances || 0)

      // Prohibited income = interest income earned by the company.
      // Yahoo exposes this under different field names depending on the company;
      // fallback chain tries each in order of specificity.
      let prohibitedIncome = 0
      let prohibitedIncomeSource = ''
      if (ts.annualInterestIncome != null) {
        prohibitedIncome = Math.max(0, ts.annualInterestIncome)
        prohibitedIncomeSource = 'Interest Income (Riba)'
      } else if (ts.annualInterestIncomeNonOperating != null) {
        prohibitedIncome = Math.max(0, ts.annualInterestIncomeNonOperating)
        prohibitedIncomeSource = 'Non-Operating Interest Income (Riba)'
      } else if (ts.annualNetInterestIncome != null && ts.annualInterestExpense != null) {
        // Derive gross interest income: netInterestIncome + abs(interestExpense)
        const interestIncome = ts.annualNetInterestIncome + Math.abs(ts.annualInterestExpense)
        prohibitedIncome = Math.max(0, interestIncome)
        prohibitedIncomeSource = 'Net Interest Income (Riba)'
      } else if (ts.annualNetNonOperatingInterestIncomeExpense != null) {
        prohibitedIncome = Math.max(0, ts.annualNetNonOperatingInterestIncomeExpense)
        prohibitedIncomeSource = 'Non-Operating Interest (Riba)'
      }

      const inc = summary?.incomeStatementHistory?.incomeStatementHistory?.[0]
      const totalIncome = inc?.totalRevenue?.raw || ts.annualTotalRevenue || fd?.totalRevenue?.raw || 0

      // If Yahoo returned a response but no actual financial data, error out
      // rather than showing a bogus all-zeros result
      if (marketCap === 0 && totalAssets === 0 && totalDebt === 0) {
        throw new Error(`No financial data available for '${ticker.toUpperCase()}'. Yahoo Finance may be rate limiting — please wait a moment and try again.`)
      }

      financials = {
        ticker: ticker.toUpperCase(),
        sector,
        industry,
        market_cap: marketCap,
        total_debt: totalDebt,
        interest_bearing_deposits: interestBearingDeposits,
        prohibited_income: prohibitedIncome,
        prohibited_income_source: prohibitedIncomeSource,
        total_income: totalIncome,
        cash,
        receivables,
        total_assets: totalAssets,
      }
    }

    const report = screenFinancials(financials)

    // Cache the result for ticker-based lookups (not manual input)
    if (!manual) {
      cacheReport(financials.ticker, report as unknown as Record<string, unknown>, financials as unknown as Record<string, unknown>).catch(() => {})
    }

    return NextResponse.json(report)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Screening failed'
    return NextResponse.json(
      { error: message },
      { status: 400 },
    )
  }
}
