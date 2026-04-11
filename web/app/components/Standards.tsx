'use client'

import { useState } from 'react'

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
    <svg viewBox="0 0 540 100" className="w-full" preserveAspectRatio="xMidYMid meet">
      {stages.map((s, i) => {
        const x = i * 108 + 6
        return (
          <g key={s}>
            {i > 0 && (
              <line
                x1={x - 20} y1="40" x2={x} y2="40"
                stroke={color} strokeWidth="2" strokeOpacity="0.4"
                strokeDasharray={animate ? '6 4' : 'none'}
              >
                {animate && (
                  <animate attributeName="stroke-dashoffset" from="10" to="0" dur="0.8s" repeatCount="indefinite" />
                )}
              </line>
            )}
            <rect
              x={x} y="14" width="88" height="52" rx="10"
              fill={color} fillOpacity={animate ? 0.12 : 0.06}
              stroke={color} strokeWidth="1.5" strokeOpacity="0.3"
            >
              {animate && (
                <animate attributeName="fill-opacity" values="0.06;0.16;0.06" dur={`${1.2 + i * 0.2}s`} repeatCount="indefinite" />
              )}
            </rect>
            <text x={x + 44} y="46" textAnchor="middle" fill={color} fontSize="14" fontFamily="Outfit, sans-serif" fontWeight="500">
              {s}
            </text>
          </g>
        )
      })}
      <text x="270" y="90" textAnchor="middle" fill={color} fontSize="12" fontFamily="Outfit, sans-serif" opacity="0.45">
        Sequential compliance gate pipeline
      </text>
    </svg>
  )
}

function SplitDiagram({ color, animate }: { color: string; animate: boolean }) {
  return (
    <svg viewBox="0 0 400 150" className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Center pool */}
      <circle cx="200" cy="30" r="26" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1.5" strokeOpacity="0.3">
        {animate && <animate attributeName="r" values="24;28;24" dur="2s" repeatCount="indefinite" />}
      </circle>
      <text x="200" y="34" textAnchor="middle" fill={color} fontSize="14" fontFamily="Outfit, sans-serif" fontWeight="600">Capital</text>

      {/* Split lines */}
      <line x1="178" y1="52" x2="120" y2="82" stroke={color} strokeWidth="2" strokeOpacity="0.4">
        {animate && <animate attributeName="stroke-opacity" values="0.2;0.5;0.2" dur="1.5s" repeatCount="indefinite" />}
      </line>
      <line x1="222" y1="52" x2="280" y2="82" stroke={color} strokeWidth="2" strokeOpacity="0.4">
        {animate && <animate attributeName="stroke-opacity" values="0.2;0.5;0.2" dur="1.5s" begin="0.3s" repeatCount="indefinite" />}
      </line>

      {/* Partner A */}
      <rect x="52" y="80" width="136" height="52" rx="10" fill={color} fillOpacity="0.08" stroke={color} strokeWidth="1.5" strokeOpacity="0.25" />
      <text x="120" y="104" textAnchor="middle" fill={color} fontSize="14" fontFamily="Outfit, sans-serif" fontWeight="500">Partner A</text>
      <text x="120" y="122" textAnchor="middle" fill={color} fontSize="12" fontFamily="Outfit, sans-serif" opacity="0.55">Profit + Loss shared</text>

      {/* Partner B */}
      <rect x="212" y="80" width="136" height="52" rx="10" fill={color} fillOpacity="0.08" stroke={color} strokeWidth="1.5" strokeOpacity="0.25" />
      <text x="280" y="104" textAnchor="middle" fill={color} fontSize="14" fontFamily="Outfit, sans-serif" fontWeight="500">Partner B</text>
      <text x="280" y="122" textAnchor="middle" fill={color} fontSize="12" fontFamily="Outfit, sans-serif" opacity="0.55">Profit + Loss shared</text>
    </svg>
  )
}

function FlowDiagram({ color, animate }: { color: string; animate: boolean }) {
  return (
    <svg viewBox="0 0 480 130" className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Label */}
      <text x="240" y="16" textAnchor="middle" fill={color} fontSize="12" fontFamily="Outfit, sans-serif" opacity="0.45">
        Capital + Labor = Shared Profit
      </text>

      {/* Investor */}
      <rect x="8" y="34" width="132" height="60" rx="10" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1.5" strokeOpacity="0.3" />
      <text x="74" y="60" textAnchor="middle" fill={color} fontSize="15" fontFamily="Outfit, sans-serif" fontWeight="600">Rabb al-Mal</text>
      <text x="74" y="80" textAnchor="middle" fill={color} fontSize="12" fontFamily="Outfit, sans-serif" opacity="0.5">(Capital Provider)</text>

      {/* Arrow 1 */}
      <line x1="148" y1="64" x2="178" y2="64" stroke={color} strokeWidth="2" strokeOpacity="0.4" />
      <polygon points="176,58 186,64 176,70" fill={color} fillOpacity="0.4" />
      {animate && (
        <circle cx="148" cy="64" r="3.5" fill={color} fillOpacity="0.6">
          <animate attributeName="cx" from="148" to="178" dur="1.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;0" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Mudarib */}
      <rect x="190" y="34" width="132" height="60" rx="10" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1.5" strokeOpacity="0.3" />
      <text x="256" y="60" textAnchor="middle" fill={color} fontSize="15" fontFamily="Outfit, sans-serif" fontWeight="600">Mudarib</text>
      <text x="256" y="80" textAnchor="middle" fill={color} fontSize="12" fontFamily="Outfit, sans-serif" opacity="0.5">(Entrepreneur)</text>

      {/* Arrow 2 */}
      <line x1="330" y1="64" x2="360" y2="64" stroke={color} strokeWidth="2" strokeOpacity="0.4" />
      <polygon points="358,58 368,64 358,70" fill={color} fillOpacity="0.4" />

      {/* Profit */}
      <rect x="372" y="34" width="100" height="60" rx="30" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.5" strokeOpacity="0.4">
        {animate && <animate attributeName="fill-opacity" values="0.08;0.2;0.08" dur="2s" repeatCount="indefinite" />}
      </rect>
      <text x="422" y="70" textAnchor="middle" fill={color} fontSize="16" fontFamily="Outfit, sans-serif" fontWeight="600">Profit</text>

      {/* Loss label */}
      <text x="240" y="120" textAnchor="middle" fill={color} fontSize="12" fontFamily="Outfit, sans-serif" opacity="0.4">
        Loss borne by investor only (unless Mudarib is negligent)
      </text>
    </svg>
  )
}

function ThresholdDiagram({ color, animate }: { color: string; animate: boolean }) {
  return (
    <svg viewBox="0 0 460 110" className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Bar track */}
      <rect x="30" y="30" width="400" height="40" rx="8" fill={color} fillOpacity="0.05" stroke={color} strokeWidth="1" strokeOpacity="0.2" />

      {/* Filled portion */}
      <rect x="30" y="30" width={animate ? '290' : '0'} height="40" rx="8" fill={color} fillOpacity="0.12">
        {animate && <animate attributeName="width" from="0" to="290" dur="1s" fill="freeze" />}
      </rect>

      {/* Nisab line */}
      <line x1="220" y1="20" x2="220" y2="78" stroke={color} strokeWidth="2" strokeDasharray="5 3" strokeOpacity="0.6" />
      <text x="220" y="14" textAnchor="middle" fill={color} fontSize="14" fontFamily="Outfit, sans-serif" fontWeight="600">Nisab</text>
      <text x="220" y="96" textAnchor="middle" fill={color} fontSize="12" fontFamily="Outfit, sans-serif" opacity="0.5">85 grams of gold</text>

      {/* Below / Above labels */}
      <text x="125" y="56" textAnchor="middle" fill={color} fontSize="14" fontFamily="Outfit, sans-serif" opacity="0.5">No Zakah</text>
      <text x="340" y="56" textAnchor="middle" fill={color} fontSize="14" fontFamily="Outfit, sans-serif" fontWeight="600">2.5% Due</text>
    </svg>
  )
}

function ScaleDiagram({ color, animate }: { color: string; animate: boolean }) {
  return (
    <svg viewBox="0 0 420 150" className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Fulcrum */}
      <polygon points="210,125 196,145 224,145" fill={color} fillOpacity="0.3" />

      {/* Beam */}
      <line x1="60" y1="80" x2="360" y2="80" stroke={color} strokeWidth="2.5" strokeOpacity="0.35">
        {animate && (
          <animateTransform attributeName="transform" type="rotate" values="-2 210 80;2 210 80;-2 210 80" dur="3s" repeatCount="indefinite" />
        )}
      </line>

      {/* Left pan - Rain */}
      <g>
        {animate && (
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur="3s" repeatCount="indefinite" />
        )}
        <line x1="70" y1="80" x2="70" y2="52" stroke={color} strokeWidth="1.5" strokeOpacity="0.3" />
        <rect x="16" y="10" width="108" height="46" rx="10" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1.5" strokeOpacity="0.25" />
        <text x="70" y="32" textAnchor="middle" fill={color} fontSize="13" fontFamily="Outfit, sans-serif" fontWeight="500">Rain-Fed</text>
        <text x="70" y="50" textAnchor="middle" fill={color} fontSize="18" fontFamily="Outfit, sans-serif" fontWeight="700">10%</text>
      </g>

      {/* Right pan - Mechanical */}
      <g>
        {animate && (
          <animateTransform attributeName="transform" type="translate" values="0 0;0 4;0 0" dur="3s" repeatCount="indefinite" />
        )}
        <line x1="350" y1="80" x2="350" y2="52" stroke={color} strokeWidth="1.5" strokeOpacity="0.3" />
        <rect x="296" y="10" width="108" height="46" rx="10" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1.5" strokeOpacity="0.25" />
        <text x="350" y="32" textAnchor="middle" fill={color} fontSize="13" fontFamily="Outfit, sans-serif" fontWeight="500">Mechanical</text>
        <text x="350" y="50" textAnchor="middle" fill={color} fontSize="18" fontFamily="Outfit, sans-serif" fontWeight="700">5%</text>
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

// ─── Helpers ────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20" height="20" viewBox="0 0 16 16"
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
      <div className="mb-10">
        <h2 className="font-display text-3xl sm:text-4xl font-light text-heading mb-3">
          AAOIFI Shari&rsquo;ah Standards
        </h2>
        <p className="text-body text-base sm:text-lg leading-relaxed max-w-2xl">
          The compliance engine enforces five standards from the AAOIFI Shari&rsquo;ah Standards
          (2017 Edition). Each standard defines specific rules and thresholds that financial
          instruments must satisfy.
        </p>
      </div>

      <div className="space-y-5">
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
                className="w-full text-left px-6 py-5 sm:px-8 sm:py-6 flex items-start gap-4 cursor-pointer"
                aria-expanded={open}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span
                      className="text-sm font-semibold tracking-wider uppercase px-2.5 py-1 rounded"
                      style={{ background: `${std.color}20`, color: std.color }}
                    >
                      {std.title}
                    </span>
                    <span className="text-label text-base font-medium truncate">
                      {std.subtitle}
                    </span>
                  </div>
                  <p className="text-dim text-base leading-relaxed">{std.summary}</p>
                </div>
                <div className="text-label mt-1">
                  <ChevronIcon open={open} />
                </div>
              </button>

              <div
                className="standard-expand-content"
                style={{ maxHeight: open ? '1000px' : '0px', opacity: open ? 1 : 0 }}
              >
                <div className="px-6 pb-6 sm:px-8 sm:pb-8 pt-0">
                  {/* Diagram */}
                  <div className="py-6 sm:py-8 mb-5 rounded-lg" style={{ background: `${std.color}08` }}>
                    <div className="px-4 sm:px-8">
                      <Diagram color={std.color} animate={open} />
                    </div>
                  </div>

                  {/* Rationale */}
                  <div className="rounded-lg p-5 mb-5" style={{ background: `${std.color}0a` }}>
                    <p className="text-body text-base leading-relaxed italic">{std.rationale}</p>
                  </div>

                  {/* Rules */}
                  <div className="space-y-4">
                    {std.rules.map((rule, ri) => (
                      <div
                        key={ri}
                        className="flex gap-3"
                        style={{ animation: open ? `slideIn 0.25s ease-out ${ri * 60}ms both` : 'none' }}
                      >
                        <div
                          className="w-1.5 rounded-full flex-shrink-0 mt-1.5"
                          style={{ background: std.color, height: '18px' }}
                        />
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2.5">
                            <p className="text-heading text-base font-medium mb-0.5">{rule.label}</p>
                            {rule.value && (
                              <span
                                className="text-sm font-semibold px-2 py-0.5 rounded"
                                style={{ background: `${std.color}18`, color: std.color }}
                              >
                                {rule.value}
                              </span>
                            )}
                          </div>
                          <p className="text-dim text-base leading-relaxed">{rule.detail}</p>
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

      <div className="mt-10 text-center">
        <p className="text-ghost text-sm">
          Source: AAOIFI Shari&rsquo;ah Standards, 2017 Edition &middot; Standards 12, 13, 21, 35, 50
        </p>
      </div>
    </div>
  )
}
