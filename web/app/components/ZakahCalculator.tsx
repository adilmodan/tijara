'use client'

import { useState } from 'react'
import type { ZakahResult, IrrigationType } from '@/lib/types'
import { computeZakah } from '@/lib/engine'

function fmtUSD(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ZakahCalculator() {
  const [liquidAssets, setLiquidAssets] = useState('')
  const [goldPrice, setGoldPrice] = useState('90')

  const [includeAgriculture, setIncludeAgriculture] = useState(false)
  const [irrigationType, setIrrigationType] = useState<IrrigationType>('rain_fed')

  const [includeGold, setIncludeGold] = useState(false)
  const [goldGrams, setGoldGrams] = useState('')

  const [includeSilver, setIncludeSilver] = useState(false)
  const [silverPrice, setSilverPrice] = useState('1.05')
  const [silverGrams, setSilverGrams] = useState('')

  const [result, setResult] = useState<ZakahResult | null>(null)
  const [error, setError] = useState('')

  const goldValue = includeGold ? (parseFloat(goldGrams) || 0) * (parseFloat(goldPrice) || 0) : 0
  const silverValue = includeSilver ? (parseFloat(silverGrams) || 0) * (parseFloat(silverPrice) || 0) : 0

  const totalWealth = (parseFloat(liquidAssets) || 0) + goldValue + silverValue

  function handleCompute() {
    setError('')
    setResult(null)

    try {
      const zakahResult = computeZakah({
        liquid_assets: parseFloat(liquidAssets) || 0,
        gold_weight_grams: includeGold ? (parseFloat(goldGrams) || 0) : 0,
        silver_weight_grams: includeSilver ? (parseFloat(silverGrams) || 0) : 0,
        gold_price_per_gram: parseFloat(goldPrice) || 90,
        silver_price_per_gram: includeSilver ? (parseFloat(silverPrice) || 1.05) : 0,
        asset_type: includeAgriculture ? 'agriculture' : 'business',
        irrigation_type: irrigationType,
      })
      setResult(zakahResult)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Computation failed')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl text-heading font-light">
          Zakah Computation
          <span className="text-accent-dim text-base ml-3 font-body">SS (35) / SS (50)</span>
        </h2>
        <p className="text-dim text-sm mt-2 leading-relaxed max-w-2xl">
          Calculate Zakah obligation based on Nisab eligibility (85g gold threshold).
          Default rate is 2.5% for business/trade assets. Toggle agriculture, gold,
          or silver to include additional holdings.
        </p>
      </div>

      <div className="card p-8 space-y-6">
        <div>
          <label className="block text-label text-xs uppercase tracking-wider mb-2">
            Liquid Net Worth ($)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="Cash, bank balances, investments"
            value={liquidAssets}
            onChange={e => setLiquidAssets(e.target.value)}
          />
          <p className="text-dim text-xs mt-1.5">
            Nisab = 85g &times; ${goldPrice || '0'}/g = ${fmtUSD(85 * (parseFloat(goldPrice) || 0))}
          </p>
        </div>

        {/* Toggles: Agriculture, Gold, Silver */}
        <div className="border-t border-gold/10 pt-5">
          <div className="text-label text-xs uppercase tracking-wider mb-3">
            Additional Holdings
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIncludeAgriculture(!includeAgriculture)}
              className={`text-sm px-4 py-2 rounded-md transition-all ${
                includeAgriculture ? 'mode-btn-active' : 'mode-btn-inactive'
              }`}
            >
              Agriculture
            </button>
            <button
              onClick={() => setIncludeGold(!includeGold)}
              className={`text-sm px-4 py-2 rounded-md transition-all ${
                includeGold ? 'mode-btn-active' : 'mode-btn-inactive'
              }`}
            >
              Gold
            </button>
            <button
              onClick={() => setIncludeSilver(!includeSilver)}
              className={`text-sm px-4 py-2 rounded-md transition-all ${
                includeSilver ? 'mode-btn-active' : 'mode-btn-inactive'
              }`}
            >
              Silver
            </button>
          </div>
        </div>

        {/* Agriculture Input */}
        {includeAgriculture && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-label text-xs uppercase tracking-wider mb-2">
                  Irrigation Type
                </label>
                <select
                  className="input-field"
                  value={irrigationType}
                  onChange={e => setIrrigationType(e.target.value as IrrigationType)}
                >
                  <option value="rain_fed">Rain-fed / Natural (10%)</option>
                  <option value="mechanical">Mechanical / Artificial (5%)</option>
                </select>
              </div>
              <div className="flex items-end">
                <div>
                  <div className="text-dim text-xs mb-1">Zakah Rate</div>
                  <div className="text-accent text-lg font-medium">
                    {irrigationType === 'rain_fed' ? '10%' : '5%'}
                  </div>
                  <div className="text-ghost text-xs mt-0.5">
                    {irrigationType === 'rain_fed' ? 'SS (50) — Natural irrigation' : 'SS (50) — Mechanical irrigation'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gold Input */}
        {includeGold && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-label text-xs uppercase tracking-wider mb-2">
                  Gold Spot Price ($/gram)
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="90"
                  value={goldPrice}
                  onChange={e => setGoldPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-label text-xs uppercase tracking-wider mb-2">
                  Gold Weight (grams)
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g. 100"
                  value={goldGrams}
                  onChange={e => setGoldGrams(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <div>
                  <div className="text-dim text-xs mb-1">Gold Value</div>
                  <div className="text-accent text-lg font-medium">
                    ${fmtUSD(goldValue)}
                  </div>
                  {goldValue > 0 && (
                    <div className="text-ghost text-xs mt-0.5">
                      {goldGrams}g &times; ${goldPrice}/g
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Silver Input */}
        {includeSilver && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-label text-xs uppercase tracking-wider mb-2">
                  Silver Spot Price ($/gram)
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="1.05"
                  value={silverPrice}
                  onChange={e => setSilverPrice(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-label text-xs uppercase tracking-wider mb-2">
                  Silver Weight (grams)
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g. 500"
                  value={silverGrams}
                  onChange={e => setSilverGrams(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <div>
                  <div className="text-dim text-xs mb-1">Silver Value</div>
                  <div className="text-accent text-lg font-medium">
                    ${fmtUSD(silverValue)}
                  </div>
                  {silverValue > 0 && (
                    <div className="text-ghost text-xs mt-0.5">
                      {silverGrams}g &times; ${silverPrice}/g
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Total Wealth Summary */}
        {(includeGold || includeSilver) && totalWealth > 0 && (
          <div className="border-t border-gold/10 pt-4">
            <div className="flex items-center justify-between">
              <div className="text-label text-xs uppercase tracking-wider">
                Total Zakatable Wealth
              </div>
              <div className="text-heading text-lg font-medium font-display">
                ${fmtUSD(totalWealth)}
              </div>
            </div>
          </div>
        )}

        <button onClick={handleCompute} disabled={!liquidAssets && !goldGrams && !silverGrams} className="btn-primary">
          Compute Zakah
        </button>
      </div>

      {error && (
        <div className="card p-5 border-crimson/30 animate-fade-in">
          <p className="text-fail text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="animate-fade-in">
          <div className={`card p-6 ${result.eligible ? 'border-gold/30' : 'border-gold/10'}`}>
            <div className="text-label text-xs uppercase tracking-wider mb-4">Zakah Assessment</div>

            {/* Wealth Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <div className="text-dim text-xs mb-1">Liquid Assets</div>
                <div className="text-body text-lg">${fmtUSD(result.liquid_assets)}</div>
              </div>
              {result.gold_value > 0 && (
                <div>
                  <div className="text-dim text-xs mb-1">Gold Holdings</div>
                  <div className="text-body text-lg">${fmtUSD(result.gold_value)}</div>
                  <div className="text-ghost text-xs mt-0.5">{goldGrams}g</div>
                </div>
              )}
              {result.silver_value > 0 && (
                <div>
                  <div className="text-dim text-xs mb-1">Silver Holdings</div>
                  <div className="text-body text-lg">${fmtUSD(result.silver_value)}</div>
                  <div className="text-ghost text-xs mt-0.5">{silverGrams}g</div>
                </div>
              )}
              <div>
                <div className="text-dim text-xs mb-1">Total Wealth</div>
                <div className="text-heading text-lg font-medium">${fmtUSD(result.net_assets)}</div>
              </div>
            </div>

            {/* Nisab + Eligibility + Rate */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6 pt-4 border-t border-gold/5">
              <div>
                <div className="text-dim text-xs mb-1">Nisab Threshold</div>
                <div className="text-body text-lg">${fmtUSD(result.nisab_value)}</div>
                <div className="text-ghost text-xs mt-0.5">85g &times; ${goldPrice}/g</div>
              </div>
              <div>
                <div className="text-dim text-xs mb-1">Eligibility</div>
                <div className={`text-lg font-medium ${result.eligible ? 'text-accent' : 'text-label'}`}>
                  {result.eligible ? 'Above Nisab' : 'Below Nisab'}
                </div>
              </div>
              <div>
                <div className="text-dim text-xs mb-1">Rate</div>
                <div className="text-body text-lg">
                  {result.rate > 0 ? `${(result.rate * 100).toFixed(1)}%` : '\u2014'}
                </div>
              </div>
            </div>

            {/* Zakah Due */}
            <div className={`rounded-lg p-6 text-center ${
              result.eligible
                ? 'bg-gradient-to-r from-gold/5 via-gold/10 to-gold/5 border border-gold/20'
                : 'bg-accent-soft border border-gold/5'
            }`}>
              <div className="text-label text-xs uppercase tracking-wider mb-2">Zakah Due</div>
              <div className={`font-display text-4xl font-medium ${result.eligible ? 'text-gold-gradient' : 'text-dim'}`}>
                ${fmtUSD(result.zakah_due)}
              </div>
              {!result.eligible && (
                <div className="text-dim text-sm mt-2">
                  No obligation &mdash; assets are ${fmtUSD(result.nisab_value - result.net_assets)} below Nisab
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
