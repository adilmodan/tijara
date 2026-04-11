'use client'

import { useState, useEffect, useRef } from 'react'

interface StandardRule {
  label: string
  detail: string
  value?: string
}

interface StandardCard {
  id: string
  title: string
  subtitle: string
  summary: string
  rationale: string
  rules: StandardRule[]
  color: string
  diagram: 'pipeline' | 'split' | 'flow' | 'threshold' | 'scale'
}

const STANDARDS: StandardCard[] = [
  {
    id: 'ss21',
    title: 'SS (21)',
    subtitle: 'Financial Paper (Shares & Bonds)',
    summary: 'Equity screening through qualitative and quantitative compliance gates',
    rationale:
      'Ensures investment in shares represents genuine participation in a lawful business, not a disguised exchange of money for money (Riba).',
    rules: [
      { label: 'Sector Filter', detail: 'Company must not operate in prohibited sectors: conventional finance, alcohol, pork, gambling, or tobacco.' },
      { label: 'Debt Ratio', detail: 'Total Debt / Market Cap must not exceed 30%.', value: '≤ 30%' },
      { label: 'Interest-Bearing Deposits', detail: 'Interest-Bearing Deposits / Market Cap must not exceed 30%.', value: '≤ 30%' },
      { label: 'Prohibited Income', detail: 'Prohibited Income (e.g., interest earned) / Total Income must not exceed 5%.', value: '≤ 5%' },
      { label: 'Tangibility', detail: 'Tangible Assets must comprise at least 30% of Total Assets.', value: '≥ 30%' },
    ],
    color: '#c9a84c',
    diagram: 'pipeline',
  },
  {
    id: 'ss12',
    title: 'SS (12)',
    subtitle: 'Musharakah (Partnership)',
    summary: 'Profit-and-loss sharing rules for joint venture partnerships',
    rationale:
      'Musharakah is a contract where two or more parties contribute capital and share profits and losses. It must remain a genuine risk-sharing arrangement, not a guaranteed-return instrument.',
    rules: [
      { label: 'Profit Distribution', detail: 'Profit must be distributed as an undivided percentage of actual net profit \u2014 never as a fixed sum or percentage of capital.' },
      { label: 'Loss Distribution', detail: 'Each partner\u2019s loss must be borne strictly in proportion to their capital contribution. No partner may be shielded from loss.' },
    ],
    color: '#2a9d8f',
    diagram: 'split',
  },
  {
    id: 'ss13',
    title: 'SS (13)',
    subtitle: 'Mudarabah (Silent Partnership)',
    summary: 'Investment management contract between capital provider and entrepreneur',
    rationale:
      'Mudarabah is a trust-based financing arrangement where one party provides capital (Rabb al-Mal) and the other provides labor and expertise (Mudarib). Profit is shared; capital loss falls on the investor.',
    rules: [
      { label: 'Profit Basis', detail: 'Profit must be a pre-agreed percentage of actual profit. Fixed sums or percentages of capital are prohibited.' },
      { label: 'Capital Protection', detail: 'The Mudarib (entrepreneur) cannot guarantee the capital. Loss is borne by the investor unless the Mudarib is negligent.' },
    ],
    color: '#6366f1',
    diagram: 'flow',
  },
  {
    id: 'ss35',
    title: 'SS (35)',
    subtitle: 'Zakah',
    summary: 'Obligatory charitable contribution on wealth exceeding the Nisab threshold',
    rationale:
      'Zakah purifies wealth and is one of the five pillars of Islam. It is due when net assets exceed the Nisab (minimum threshold) for one lunar year.',
    rules: [
      { label: 'Nisab Threshold', detail: 'The minimum wealth threshold is the value of 85 grams of gold. If net assets fall below this, Zakah is not obligatory.', value: '85g Au' },
      { label: 'Business Rate', detail: 'Zakah on business and trade assets is 2.5% of net Zakatable assets annually.', value: '2.5%' },
    ],
    color: '#e07a3a',
    diagram: 'threshold',
  },
  {
    id: 'ss50',
    title: 'SS (50)',
    subtitle: 'Zakah on Agricultural Output',
    summary: 'Differentiated Zakah rates based on irrigation method',
    rationale:
      'Agricultural output is subject to Zakah at varying rates depending on the cost and effort of irrigation, reflecting the principle that divine provision (rain) carries a higher obligation.',
    rules: [
      { label: 'Rain-Fed / Natural', detail: 'Crops irrigated by rain, rivers, or springs: Zakah rate is 10% of the harvest.', value: '10%' },
      { label: 'Mechanical Irrigation', detail: 'Crops irrigated by paid means (pumps, wells, canals): Zakah rate is 5% of the harvest.', value: '5%' },
    ],
    color: '#c0392b',
    diagram: 'scale',
  },
]

// ─── SVG Diagrams ───────────────────────────────────────────────────

function PipelineDiagram({ color, animate }: { color: string; animate: boolean }) {
  const stages = ['Sector', 'Debt', 'Interest', 'Income', 'Tangible']
  return (
    <svg viewBox="0 0 320 56" className="w-full max-w-xs">
      {stages.map((s, i) => {
        const x = i * 64 + 4
        return (
          <g key={s}>
            {i > 0 && (
              <line
                x1={x - 12} y1="22" x2={x} y2="22"
                stroke={color} strokeWidth="1.5" strokeOpacity="0.4"
                strokeDasharray={animate ? '4 3' : 'none'}
              >
                {animate && (
                  <animate attributeName="stroke-dashoffset" from="7" to="0" dur="0.8s" repeatCount="indefinite" />
                )}
              </line>
            )}
            <rect
              x={x} y="6" width="52" height="32" rx="6"
              fill={color} fillOpacity={animate ? 0.12 : 0.06}
              stroke={color} strokeWidth="1" strokeOpacity="0.3"
            >
              {animate && (
                <animate attributeName="fill-opacity" values="0.06;0.14;0.06" dur={`${1.2 + i * 0.2}s`} repeatCount="indefinite" />
              )}
            </rect>
            <text x={x + 26} y="26" textAnchor="middle" fill={color} fontSize="8" fontFamily="Outfit, sans-serif" fontWeight="500">
              {s}
            </text>
          </g>
        )
      })}
      <text x="160" y="52" textAnchor="middle" fill={color} fontSize="7" fontFamily="Outfit, sans-serif" opacity="0.5">
        Sequential gate pipeline
      </text>
    </svg>
  )
}

function SplitDiagram({ color, animate }: { color: string; animate: boolean }) {
  return (
    <svg viewBox="0 0 240 80" className="w-full max-w-[200px]">
      {/* Center pool */}
      <circle cx="120" cy="16" r="14" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1" strokeOpacity="0.3">
        {animate && <animate attributeName="r" values="13;15;13" dur="2s" repeatCount="indefinite" />}
      </circle>
      <text x="120" y="19" textAnchor="middle" fill={color} fontSize="7" fontFamily="Outfit, sans-serif" fontWeight="600">Capital</text>

      {/* Split lines */}
      <line x1="108" y1="28" x2="70" y2="48" stroke={color} strokeWidth="1" strokeOpacity="0.4">
        {animate && <animate attributeName="stroke-opacity" values="0.2;0.5;0.2" dur="1.5s" repeatCount="indefinite" />}
      </line>
      <line x1="132" y1="28" x2="170" y2="48" stroke={color} strokeWidth="1" strokeOpacity="0.4">
        {animate && <animate attributeName="stroke-opacity" values="0.2;0.5;0.2" dur="1.5s" begin="0.3s" repeatCount="indefinite" />}
      </line>

      {/* Partner A */}
      <rect x="36" y="44" width="68" height="28" rx="6" fill={color} fillOpacity="0.08" stroke={color} strokeWidth="1" strokeOpacity="0.25" />
      <text x="70" y="57" textAnchor="middle" fill={color} fontSize="7" fontFamily="Outfit, sans-serif" fontWeight="500">Partner A</text>
      <text x="70" y="67" textAnchor="middle" fill={color} fontSize="6" fontFamily="Outfit, sans-serif" opacity="0.6">Profit + Loss</text>

      {/* Partner B */}
      <rect x="136" y="44" width="68" height="28" rx="6" fill={color} fillOpacity="0.08" stroke={color} strokeWidth="1" strokeOpacity="0.25" />
      <text x="170" y="57" textAnchor="middle" fill={color} fontSize="7" fontFamily="Outfit, sans-serif" fontWeight="500">Partner B</text>
      <text x="170" y="67" textAnchor="middle" fill={color} fontSize="6" fontFamily="Outfit, sans-serif" opacity="0.6">Profit + Loss</text>
    </svg>
  )
}

function FlowDiagram({ color, animate }: { color: string; animate: boolean }) {
  return (
    <svg viewBox="0 0 260 80" className="w-full max-w-[220px]">
      {/* Investor */}
      <rect x="4" y="24" width="72" height="32" rx="6" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
      <text x="40" y="38" textAnchor="middle" fill={color} fontSize="7" fontFamily="Outfit, sans-serif" fontWeight="600">Rabb al-Mal</text>
      <text x="40" y="48" textAnchor="middle" fill={color} fontSize="6" fontFamily="Outfit, sans-serif" opacity="0.5">(Capital)</text>

      {/* Arrow */}
      <line x1="80" y1="40" x2="108" y2="40" stroke={color} strokeWidth="1.5" strokeOpacity="0.4" markerEnd="url(#arrow-flow)">
        {animate && <animate attributeName="stroke-dashoffset" from="8" to="0" dur="1s" repeatCount="indefinite" />}
      </line>
      {animate && (
        <circle cx="94" cy="40" r="2" fill={color} fillOpacity="0.6">
          <animate attributeName="cx" from="80" to="108" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Mudarib */}
      <rect x="112" y="24" width="72" height="32" rx="6" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
      <text x="148" y="38" textAnchor="middle" fill={color} fontSize="7" fontFamily="Outfit, sans-serif" fontWeight="600">Mudarib</text>
      <text x="148" y="48" textAnchor="middle" fill={color} fontSize="6" fontFamily="Outfit, sans-serif" opacity="0.5">(Expertise)</text>

      {/* Arrow to profit */}
      <line x1="188" y1="40" x2="216" y2="40" stroke={color} strokeWidth="1.5" strokeOpacity="0.4" />

      {/* Profit */}
      <rect x="220" y="24" width="36" height="32" rx="16" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1" strokeOpacity="0.4">
        {animate && <animate attributeName="fill-opacity" values="0.08;0.18;0.08" dur="2s" repeatCount="indefinite" />}
      </rect>
      <text x="238" y="44" textAnchor="middle" fill={color} fontSize="7" fontFamily="Outfit, sans-serif" fontWeight="600">Profit</text>

      {/* Labels */}
      <text x="130" y="12" textAnchor="middle" fill={color} fontSize="6" fontFamily="Outfit, sans-serif" opacity="0.4">
        Capital + Labor → Shared Profit
      </text>
      <text x="94" y="72" textAnchor="middle" fill={color} fontSize="6" fontFamily="Outfit, sans-serif" opacity="0.4">
        Loss → Investor only
      </text>
    </svg>
  )
}

function ThresholdDiagram({ color, animate }: { color: string; animate: boolean }) {
  const barHeight = 40
  const nisabX = 120
  return (
    <svg viewBox="0 0 260 70" className="w-full max-w-[220px]">
      {/* Bar track */}
      <rect x="20" y="16" width="220" height="24" rx="4" fill={color} fillOpacity="0.05" stroke={color} strokeWidth="0.5" strokeOpacity="0.2" />

      {/* Filled portion */}
      <rect x="20" y="16" width={animate ? '160' : '0'} height="24" rx="4" fill={color} fillOpacity="0.12">
        {animate && <animate attributeName="width" from="0" to="160" dur="1s" fill="freeze" />}
      </rect>

      {/* Nisab line */}
      <line x1={nisabX} y1="10" x2={nisabX} y2={barHeight + 4} stroke={color} strokeWidth="1.5" strokeDasharray="3 2" strokeOpacity="0.6" />
      <text x={nisabX} y="8" textAnchor="middle" fill={color} fontSize="7" fontFamily="Outfit, sans-serif" fontWeight="600">Nisab</text>
      <text x={nisabX} y="56" textAnchor="middle" fill={color} fontSize="6" fontFamily="Outfit, sans-serif" opacity="0.5">85g Gold</text>

      {/* Below / Above labels */}
      <text x="70" y="32" textAnchor="middle" fill={color} fontSize="7" fontFamily="Outfit, sans-serif" opacity="0.5">No Zakah</text>
      <text x="190" y="32" textAnchor="middle" fill={color} fontSize="7" fontFamily="Outfit, sans-serif" fontWeight="500">2.5% Due</text>

      <text x="130" y="68" textAnchor="middle" fill={color} fontSize="6" fontFamily="Outfit, sans-serif" opacity="0.35">
        Net assets must exceed Nisab threshold
      </text>
    </svg>
  )
}

function ScaleDiagram({ color, animate }: { color: string; animate: boolean }) {
  return (
    <svg viewBox="0 0 240 80" className="w-full max-w-[200px]">
      {/* Fulcrum */}
      <polygon points="120,68 112,78 128,78" fill={color} fillOpacity="0.3" />

      {/* Beam */}
      <line x1="40" y1="44" x2="200" y2="44" stroke={color} strokeWidth="1.5" strokeOpacity="0.4">
        {animate && (
          <animateTransform attributeName="transform" type="rotate" values="-2 120 44;2 120 44;-2 120 44" dur="3s" repeatCount="indefinite" />
        )}
      </line>

      {/* Left pan - Rain */}
      <g>
        {animate && (
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -2;0 0" dur="3s" repeatCount="indefinite" />
        )}
        <line x1="40" y1="44" x2="40" y2="30" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
        <rect x="12" y="10" width="56" height="24" rx="6" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1" strokeOpacity="0.25" />
        <text x="40" y="22" textAnchor="middle" fill={color} fontSize="7" fontFamily="Outfit, sans-serif" fontWeight="500">Rain-Fed</text>
        <text x="40" y="30" textAnchor="middle" fill={color} fontSize="8" fontFamily="Outfit, sans-serif" fontWeight="700">10%</text>
      </g>

      {/* Right pan - Mechanical */}
      <g>
        {animate && (
          <animateTransform attributeName="transform" type="translate" values="0 0;0 2;0 0" dur="3s" repeatCount="indefinite" />
        )}
        <line x1="200" y1="44" x2="200" y2="30" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
        <rect x="172" y="10" width="56" height="24" rx="6" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1" strokeOpacity="0.25" />
        <text x="200" y="22" textAnchor="middle" fill={color} fontSize="7" fontFamily="Outfit, sans-serif" fontWeight="500">Mechanical</text>
        <text x="200" y="30" textAnchor="middle" fill={color} fontSize="8" fontFamily="Outfit, sans-serif" fontWeight="700">5%</text>
      </g>
    </svg>
  )
}

const DIAGRAM_MAP = {
  pipeline: PipelineDiagram,
  split: SplitDiagram,
  flow: FlowDiagram,
  threshold: ThresholdDiagram,
  scale: ScaleDiagram,
}

// ─── Card Component ─────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 16 16"
      fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className="flex-shrink-0 transition-transform duration-300"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}

// ─── Main Component ─────────────────────────────────────────────────

export default function Standards() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl sm:text-3xl font-light text-heading mb-2">
          AAOIFI Shari&rsquo;ah Standards
        </h2>
        <p className="text-body text-sm sm:text-base leading-relaxed max-w-2xl">
          The compliance engine enforces five standards from the AAOIFI Shari&rsquo;ah Standards
          (2017 Edition). Each standard defines specific rules and thresholds that financial
          instruments must satisfy.
        </p>
      </div>

      <div className="space-y-4">
        {STANDARDS.map((std, i) => {
          const open = expanded.has(std.id)
          const Diagram = DIAGRAM_MAP[std.diagram]

          return (
            <div
              key={std.id}
              className="card overflow-hidden"
              style={{
                borderLeftWidth: '3px',
                borderLeftColor: std.color,
                animation: `fadeIn 0.4s ease-out ${i * 80}ms both`,
              }}
            >
              <button
                onClick={() => toggle(std.id)}
                className="w-full text-left px-5 py-4 sm:px-6 sm:py-5 flex items-start gap-4 cursor-pointer"
                aria-expanded={open}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className="text-xs font-semibold tracking-wider uppercase px-2 py-0.5 rounded"
                      style={{ background: `${std.color}20`, color: std.color }}
                    >
                      {std.title}
                    </span>
                    <span className="text-label text-sm font-medium truncate">
                      {std.subtitle}
                    </span>
                  </div>
                  <p className="text-dim text-sm leading-relaxed">{std.summary}</p>
                </div>
                <div className="text-label mt-1">
                  <ChevronIcon open={open} />
                </div>
              </button>

              <div
                className="standard-expand-content"
                style={{ maxHeight: open ? '800px' : '0px', opacity: open ? 1 : 0 }}
              >
                <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
                  {/* Diagram */}
                  <div className="flex justify-center py-4 mb-4 rounded-lg" style={{ background: `${std.color}08` }}>
                    <Diagram color={std.color} animate={open} />
                  </div>

                  {/* Rationale */}
                  <div className="rounded-lg p-4 mb-4" style={{ background: `${std.color}0a` }}>
                    <p className="text-body text-sm leading-relaxed italic">{std.rationale}</p>
                  </div>

                  {/* Rules */}
                  <div className="space-y-3">
                    {std.rules.map((rule, ri) => (
                      <div
                        key={ri}
                        className="flex gap-3"
                        style={{ animation: open ? `slideIn 0.25s ease-out ${ri * 60}ms both` : 'none' }}
                      >
                        <div
                          className="w-1.5 rounded-full flex-shrink-0 mt-1"
                          style={{ background: std.color, height: '16px' }}
                        />
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <p className="text-heading text-sm font-medium mb-0.5">{rule.label}</p>
                            {rule.value && (
                              <span
                                className="text-xs font-semibold px-1.5 py-0.5 rounded"
                                style={{ background: `${std.color}18`, color: std.color }}
                              >
                                {rule.value}
                              </span>
                            )}
                          </div>
                          <p className="text-dim text-sm leading-relaxed">{rule.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 text-center">
        <p className="text-ghost text-xs">
          Source: AAOIFI Shari&rsquo;ah Standards, 2017 Edition &middot; Standards 12, 13, 21, 35, 50
        </p>
      </div>
    </div>
  )
}
