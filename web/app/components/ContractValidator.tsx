'use client'

import { useState } from 'react'
import type { ScreeningResult, ProfitBasis } from '@/lib/types'
import { validateContract } from '@/lib/engine'
import ViolationList from './ViolationList'

interface Partner {
  lossRatio: string
  capitalRatio: string
}

export default function ContractValidator() {
  const [profitBasis, setProfitBasis] = useState<ProfitBasis>('percentage_of_profit')
  const [partners, setPartners] = useState<Partner[]>([
    { lossRatio: '0.5', capitalRatio: '0.5' },
    { lossRatio: '0.5', capitalRatio: '0.5' },
  ])
  const [result, setResult] = useState<ScreeningResult | null>(null)
  const [error, setError] = useState('')

  function addPartner() {
    setPartners(p => [...p, { lossRatio: '0', capitalRatio: '0' }])
  }

  function removePartner(i: number) {
    if (partners.length <= 2) return
    setPartners(p => p.filter((_, idx) => idx !== i))
  }

  function updatePartner(i: number, field: keyof Partner, value: string) {
    setPartners(p => p.map((partner, idx) => idx === i ? { ...partner, [field]: value } : partner))
  }

  function handleValidate() {
    setError('')
    setResult(null)

    try {
      const validationResult = validateContract({
        profit_basis: profitBasis,
        loss_ratios: partners.map(p => parseFloat(p.lossRatio) || 0),
        capital_ratios: partners.map(p => parseFloat(p.capitalRatio) || 0),
      })
      setResult(validationResult)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Validation failed')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl text-heading font-light">
          Contract Validation
          <span className="text-accent-dim text-base ml-3 font-body">SS (12) / SS (13)</span>
        </h2>
        <p className="text-dim text-sm mt-2 leading-relaxed max-w-2xl">
          Validate Musharakah and Mudarabah partnership contracts. Profit must be distributed
          as a percentage of actual net profit. Loss must follow capital contribution ratios exactly.
        </p>
      </div>

      <div className="card p-8 space-y-6">
        <div>
          <label className="block text-label text-xs uppercase tracking-wider mb-2">
            Profit Distribution Basis
          </label>
          <select
            className="input-field max-w-md"
            value={profitBasis}
            onChange={e => setProfitBasis(e.target.value as ProfitBasis)}
          >
            <option value="percentage_of_profit">Percentage of Actual Net Profit (Compliant)</option>
            <option value="fixed_sum">Fixed Lump Sum (Prohibited)</option>
            <option value="percentage_of_capital">Percentage of Capital (Prohibited)</option>
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-label text-xs uppercase tracking-wider">
              Partner Ratios
            </label>
            <button
              onClick={addPartner}
              className="text-accent-dim text-xs hover:text-accent transition-colors"
            >
              + Add Partner
            </button>
          </div>

          <div className="space-y-3">
            {partners.map((p, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-dim text-sm w-24 flex-shrink-0">Partner {i + 1}</span>
                <div className="flex-1">
                  <label className="block text-dim text-xs mb-1">Loss Ratio</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={p.lossRatio}
                    onChange={e => updatePartner(i, 'lossRatio', e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-dim text-xs mb-1">Capital Ratio</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={p.capitalRatio}
                    onChange={e => updatePartner(i, 'capitalRatio', e.target.value)}
                  />
                </div>
                {partners.length > 2 && (
                  <button
                    onClick={() => removePartner(i)}
                    className="text-fail text-sm mt-5 transition-colors opacity-60 hover:opacity-100"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="text-ghost text-xs mt-3">
            Loss ratios must equal capital contribution ratios for each partner per SS (12).
            Ratios should sum to 1.0.
          </p>
        </div>

        <button onClick={handleValidate} className="btn-primary">
          Validate Contract
        </button>
      </div>

      {error && (
        <div className="card p-5 border-crimson/30 animate-fade-in">
          <p className="text-fail text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="animate-fade-in space-y-4">
          <div className={`card p-6 ${
            result.status === 'COMPLIANT' ? 'border-teal/30' : 'border-crimson/30'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-label text-xs uppercase tracking-wider mb-1">Contract Status</div>
                <div className="font-display text-2xl text-heading">
                  {profitBasis === 'percentage_of_profit' ? 'Percentage of Profit' :
                   profitBasis === 'fixed_sum' ? 'Fixed Sum' : 'Percentage of Capital'}
                </div>
              </div>
              <span className={`inline-block px-5 py-2.5 rounded-md text-sm font-semibold tracking-wider uppercase ${
                result.status === 'COMPLIANT' ? 'badge-compliant' : 'badge-non-compliant'
              }`}>
                {result.status}
              </span>
            </div>
          </div>

          {result.violations.length > 0 && (
            <ViolationList violations={result.violations} />
          )}
        </div>
      )}
    </div>
  )
}
