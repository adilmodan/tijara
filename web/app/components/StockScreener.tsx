'use client'

import { useState, useCallback, useEffect } from 'react'
import type { FullScreeningReport, CompanyFinancials, Violation } from '@/lib/types'
import {
  DEBT_THRESHOLD,
  INTEREST_DEPOSIT_THRESHOLD,
  PROHIBITED_INCOME_CAP,
  MIN_TANGIBILITY,
} from '@/lib/constants'
import ViolationList from './ViolationList'

const COOLDOWN_MS = 5_000
const STARTUP_COOLDOWN_MS = 10_000

export default function StockScreener() {
  const [mode, setMode] = useState<'ticker' | 'manual'>('ticker')
  const [ticker, setTicker] = useState('')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<FullScreeningReport | null>(null)
  const [error, setError] = useState('')

  // Cooldown: 10s on startup, 5s after each ticker search
  const [cooldownEnd, setCooldownEnd] = useState(() => Date.now() + STARTUP_COOLDOWN_MS)
  const [cooldownMs, setCooldownMs] = useState(STARTUP_COOLDOWN_MS)
  const [, rerender] = useState(0)
  const isCooling = cooldownEnd > Date.now()

  // Re-render every second while cooling to update the countdown display
  useEffect(() => {
    if (cooldownEnd <= Date.now()) return
    const id = setInterval(() => rerender(n => n + 1), 1000)
    return () => clearInterval(id)
  }, [cooldownEnd])

  // Warm up Yahoo Finance: fire at 0s, 3s, and 6s
  useEffect(() => {
    const warmup = () =>
      fetch('/api/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: 'CVNA', manual: false }),
      }).catch(() => {})

    warmup()
    const id3 = setTimeout(warmup, 3_000)
    const id6 = setTimeout(warmup, 6_000)
    return () => { clearTimeout(id3); clearTimeout(id6) }
  }, [])

  const startCooldown = useCallback(() => {
    setCooldownMs(COOLDOWN_MS)
    setCooldownEnd(Date.now() + COOLDOWN_MS)
  }, [])

  const [manual, setManual] = useState<CompanyFinancials>({
    ticker: '', sector: '', industry: '', market_cap: 0,
    total_debt: 0, interest_bearing_deposits: 0,
    prohibited_income: 0, prohibited_income_source: '', total_income: 0,
    cash: 0, receivables: 0, total_assets: 0,
  })

  const handleScreen = useCallback(async () => {
    if (isCooling) return
    setLoading(true)
    setError('')
    setReport(null)

    try {
      const body = mode === 'ticker'
        ? { ticker: ticker.toUpperCase(), manual: false }
        : { manual: true, financials: { ...manual, ticker: manual.ticker || 'MANUAL' } }

      const res = await fetch('/api/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setReport(data)
      // Skip cooldown if the result came from Supabase cache (no Yahoo API call was made)
      if (mode === 'ticker' && !data.cached) startCooldown()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Screening failed'
      if (msg.includes('temporarily unavailable') || msg.includes('429')) {
        setError('Yahoo Finance is rate limiting requests. Please wait a few seconds and try again.')
      } else {
        setError(msg)
      }
      if (mode === 'ticker') startCooldown()
    } finally {
      setLoading(false)
    }
  }, [mode, ticker, manual, isCooling, startCooldown])

  const cooldownSeconds = Math.ceil((cooldownEnd - Date.now()) / 1000)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl text-heading font-light">
          Equity Screening
          <span className="text-accent-dim text-base ml-3 font-body">SS (21)</span>
        </h2>
        <p className="text-dim text-sm mt-2 leading-relaxed max-w-2xl">
          Qualitative sector filter followed by quantitative ratio analysis.
          Debt, interest deposits, prohibited income, and tangible asset composition
          are validated against AAOIFI thresholds.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setMode('ticker')}
          className={`text-sm px-4 py-2 rounded-md transition-all ${
            mode === 'ticker' ? 'mode-btn-active' : 'mode-btn-inactive'
          }`}
        >
          Search by Ticker
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`text-sm px-4 py-2 rounded-md transition-all ${
            mode === 'manual' ? 'mode-btn-active' : 'mode-btn-inactive'
          }`}
        >
          Manual Input
        </button>
      </div>

      <div className="card p-8">
        {mode === 'ticker' ? (
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-label text-xs uppercase tracking-wider mb-2">
                Ticker Symbol
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. AAPL, MSFT, 2222.SR"
                value={ticker}
                onChange={e => setTicker(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isCooling && handleScreen()}
              />
            </div>
            <CooldownButton
              onClick={handleScreen}
              disabled={loading || !ticker.trim()}
              loading={loading}
              cooling={isCooling}
              cooldownSeconds={cooldownSeconds}
              cooldownMs={cooldownMs}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Ticker" value={manual.ticker} onChange={v => setManual(m => ({ ...m, ticker: v }))} placeholder="AAPL" />
              <Field label="Sector" value={manual.sector} onChange={v => setManual(m => ({ ...m, sector: v }))} placeholder="Technology" />
              <Field label="Industry" value={manual.industry} onChange={v => setManual(m => ({ ...m, industry: v }))} placeholder="Consumer Electronics" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumField label="Market Cap ($)" value={manual.market_cap} onChange={v => setManual(m => ({ ...m, market_cap: v }))} />
              <NumField label="Total Debt ($)" value={manual.total_debt} onChange={v => setManual(m => ({ ...m, total_debt: v }))} />
              <NumField label="Interest-Bearing Deposits ($)" value={manual.interest_bearing_deposits} onChange={v => setManual(m => ({ ...m, interest_bearing_deposits: v }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumField label="Prohibited Income ($)" value={manual.prohibited_income} onChange={v => setManual(m => ({ ...m, prohibited_income: v }))} />
              <NumField label="Total Income ($)" value={manual.total_income} onChange={v => setManual(m => ({ ...m, total_income: v }))} />
              <NumField label="Total Assets ($)" value={manual.total_assets} onChange={v => setManual(m => ({ ...m, total_assets: v }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumField label="Cash & Equivalents ($)" value={manual.cash} onChange={v => setManual(m => ({ ...m, cash: v }))} />
              <NumField label="Receivables ($)" value={manual.receivables} onChange={v => setManual(m => ({ ...m, receivables: v }))} />
            </div>
            <button onClick={handleScreen} disabled={loading} className="btn-primary">
              {loading ? <span className="spinner" /> : 'Run Screening'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="card p-5 border-crimson/30 animate-fade-in">
          <p className="text-fail text-sm">{error}</p>
        </div>
      )}

      {report && (
        <div className="space-y-6 animate-fade-in">
          <div className={`card p-6 flex items-center justify-between ${
            report.status === 'COMPLIANT' ? 'border-teal/30' : 'border-crimson/30'
          }`}>
            <div>
              <div className="text-label text-xs uppercase tracking-wider mb-1">Compliance Status</div>
              <div className="font-display text-3xl font-medium text-heading">
                {report.ticker}
              </div>
              <div className="text-label text-sm mt-1">
                {report.financials.sector} &middot; {report.financials.industry}
              </div>
            </div>
            <div>
              <span className={`inline-block px-5 py-2.5 rounded-md text-sm font-semibold tracking-wider uppercase ${
                report.status === 'COMPLIANT' ? 'badge-compliant' : 'badge-non-compliant'
              }`}>
                {report.status}
              </span>
              <div className="text-right text-dim text-xs mt-2">
                {report.status === 'COMPLIANT' ? 'TRANSACTION PERMITTED' : 'TRANSACTION BLOCKED'}
              </div>
            </div>
          </div>

          {/* Yahoo Finance link */}
          <a
            href={`https://finance.yahoo.com/quote/${encodeURIComponent(report.ticker)}/financials/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-accent text-sm hover:text-gold-light transition-colors underline underline-offset-2 decoration-gold/30 hover:decoration-gold/60"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            View {report.ticker} financials on Yahoo Finance
          </a>

          <div className="card p-6">
            <h3 className="text-label text-xs uppercase tracking-wider mb-4">Financial Data</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Metric label="Market Cap" value={fmt(report.financials.market_cap)} />
              <Metric label="Total Debt" value={fmt(report.financials.total_debt)} />
              <Metric label="Cash" value={fmt(report.financials.cash)} />
              <Metric label="Total Assets" value={fmt(report.financials.total_assets)} />
            </div>
            {report.financials.market_cap > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gold/5">
                <Metric
                  label="Debt / Market Cap"
                  value={pct(report.financials.total_debt / report.financials.market_cap)}
                  threshold={`≤ ${DEBT_THRESHOLD * 100}%`}
                  pass={report.financials.total_debt / report.financials.market_cap <= DEBT_THRESHOLD}
                />
                <Metric
                  label="Interest Dep. / Market Cap"
                  value={pct(report.financials.interest_bearing_deposits / report.financials.market_cap)}
                  threshold={`≤ ${INTEREST_DEPOSIT_THRESHOLD * 100}%`}
                  pass={report.financials.interest_bearing_deposits / report.financials.market_cap <= INTEREST_DEPOSIT_THRESHOLD}
                />
                {report.financials.total_income > 0 && (
                  <Metric
                    label="Prohibited / Total Income"
                    value={pct(report.financials.prohibited_income / report.financials.total_income)}
                    threshold={`≤ ${PROHIBITED_INCOME_CAP * 100}%`}
                    pass={report.financials.prohibited_income / report.financials.total_income <= PROHIBITED_INCOME_CAP}
                    subtitle={report.financials.prohibited_income_source || undefined}
                  />
                )}
                {report.financials.total_assets > 0 && (
                  <Metric
                    label="Tangible Assets"
                    value={pct(1 - (report.financials.cash + report.financials.receivables) / report.financials.total_assets)}
                    threshold={`≥ ${MIN_TANGIBILITY * 100}%`}
                    pass={1 - (report.financials.cash + report.financials.receivables) / report.financials.total_assets >= MIN_TANGIBILITY}
                  />
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ModuleResult title="Qualitative" standard="SS (21)" result={report.qualitative} />
            <ModuleResult title="Quantitative" standard="SS (21)" result={report.quantitative} />
            <ModuleResult title="Tangibility" standard="SS (21)" result={report.tangibility} />
          </div>

          {report.violations.length > 0 && (
            <ViolationList violations={report.violations} />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Cooldown Button ─────────────────────────────────────────────────

function CooldownButton({ onClick, disabled, loading, cooling, cooldownSeconds, cooldownMs }: {
  onClick: () => void
  disabled: boolean
  loading: boolean
  cooling: boolean
  cooldownSeconds: number
  cooldownMs: number
}) {
  if (cooling) {
    return (
      <button
        disabled
        className="btn-cooldown"
        style={{ '--cooldown-duration': `${cooldownMs}ms` } as React.CSSProperties}
      >
        {cooldownSeconds}s
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn-primary"
    >
      {loading ? <span className="spinner" /> : 'Screen'}
    </button>
  )
}

// ─── Helper Components ───────────────────────────────────────────────

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-label text-xs uppercase tracking-wider mb-2">{label}</label>
      <input type="text" className="input-field" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

function NumField({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void
}) {
  return (
    <div>
      <label className="block text-label text-xs uppercase tracking-wider mb-2">{label}</label>
      <input
        type="number"
        className="input-field"
        value={value || ''}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        placeholder="0"
      />
    </div>
  )
}

function Metric({ label, value, threshold, pass: isPass, subtitle }: {
  label: string; value: string; threshold?: string; pass?: boolean; subtitle?: string
}) {
  return (
    <div>
      <div className="text-dim text-xs mb-1">{label}</div>
      <div className={`text-lg font-medium ${
        isPass === undefined ? 'text-body' : isPass ? 'text-pass' : 'text-fail'
      }`}>
        {value}
      </div>
      {subtitle && (
        <div className="text-ghost text-xs mt-0.5">{subtitle}</div>
      )}
      {threshold && (
        <div className="text-ghost text-xs mt-0.5">Threshold: {threshold}</div>
      )}
    </div>
  )
}

function ModuleResult({ title, standard, result }: {
  title: string; standard: string; result: { status: string; violations: Violation[] } | null
}) {
  if (!result) {
    return (
      <div className="card p-5 opacity-40">
        <div className="text-dim text-xs uppercase tracking-wider mb-2">{title}</div>
        <div className="text-ghost text-sm">Skipped</div>
      </div>
    )
  }

  return (
    <div className={`card p-5 ${
      result.status === 'COMPLIANT' ? 'border-teal/20' : 'border-crimson/20'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div className="text-label text-xs uppercase tracking-wider">{title}</div>
        <div className="text-ghost text-xs">{standard}</div>
      </div>
      <span className={`inline-block px-3 py-1 rounded text-xs font-semibold tracking-wider uppercase ${
        result.status === 'COMPLIANT' ? 'badge-compliant' : 'badge-non-compliant'
      }`}>
        {result.status === 'COMPLIANT' ? 'PASS' : 'FAIL'}
      </span>
      {result.violations.length > 0 && (
        <div className="text-dim text-xs mt-2">
          {result.violations.length} violation{result.violations.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

function fmt(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

function pct(n: number): string {
  return `${(n * 100).toFixed(2)}%`
}
