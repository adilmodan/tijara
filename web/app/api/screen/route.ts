import { NextResponse } from 'next/server'
import { screenFinancials } from '@/lib/engine'
import type { CompanyFinancials } from '@/lib/types'

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

// ─── Route Handler ───────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ticker, manual } = body

    let financials: CompanyFinancials

    if (manual) {
      financials = body.financials as CompanyFinancials
    } else {
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
    return NextResponse.json(report)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Screening failed'
    return NextResponse.json(
      { error: message },
      { status: 400 },
    )
  }
}
