'use client'

import { useState } from 'react'

interface StandardRule {
  label: string
  detail: string
}

interface StandardCard {
  id: string
  title: string
  subtitle: string
  summary: string
  rationale: string
  rules: StandardRule[]
  color: 'gold' | 'teal' | 'crimson'
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
      {
        label: 'Sector Filter',
        detail:
          'Company must not operate in prohibited sectors: conventional finance, alcohol, pork, gambling, or tobacco.',
      },
      {
        label: 'Debt Ratio',
        detail: 'Total Debt / Market Cap must not exceed 30%.',
      },
      {
        label: 'Interest-Bearing Deposits',
        detail: 'Interest-Bearing Deposits / Market Cap must not exceed 30%.',
      },
      {
        label: 'Prohibited Income',
        detail:
          'Prohibited Income (e.g., interest earned) / Total Income must not exceed 5%.',
      },
      {
        label: 'Tangibility',
        detail:
          'Tangible Assets must comprise at least 30% of Total Assets. Cash and receivables alone cannot dominate the balance sheet.',
      },
    ],
    color: 'gold',
  },
  {
    id: 'ss12',
    title: 'SS (12)',
    subtitle: 'Musharakah (Partnership)',
    summary: 'Profit-and-loss sharing rules for joint venture partnerships',
    rationale:
      'Musharakah is a contract where two or more parties contribute capital and share profits and losses. It must remain a genuine risk-sharing arrangement, not a guaranteed-return instrument.',
    rules: [
      {
        label: 'Profit Distribution',
        detail:
          'Profit must be distributed as an undivided percentage of actual net profit \u2014 never as a fixed sum or percentage of capital.',
      },
      {
        label: 'Loss Distribution',
        detail:
          'Each partner\u2019s loss must be borne strictly in proportion to their capital contribution. No partner may be shielded from loss.',
      },
    ],
    color: 'teal',
  },
  {
    id: 'ss13',
    title: 'SS (13)',
    subtitle: 'Mudarabah (Silent Partnership)',
    summary: 'Investment management contract between capital provider and entrepreneur',
    rationale:
      'Mudarabah is a trust-based financing arrangement where one party provides capital (Rabb al-Mal) and the other provides labor and expertise (Mudarib). Profit is shared; capital loss falls on the investor.',
    rules: [
      {
        label: 'Profit Basis',
        detail:
          'Profit must be a pre-agreed percentage of actual profit. Fixed sums or percentages of capital are prohibited as they convert the arrangement into a loan (Riba).',
      },
      {
        label: 'Capital Protection',
        detail:
          'The Mudarib (entrepreneur) cannot guarantee the capital. Loss of capital is borne by the investor unless the Mudarib is negligent.',
      },
    ],
    color: 'teal',
  },
  {
    id: 'ss35',
    title: 'SS (35)',
    subtitle: 'Zakah',
    summary: 'Obligatory charitable contribution on wealth exceeding the Nisab threshold',
    rationale:
      'Zakah purifies wealth and is one of the five pillars of Islam. It is due when net assets exceed the Nisab (minimum threshold) for one lunar year.',
    rules: [
      {
        label: 'Nisab Threshold',
        detail:
          'The minimum wealth threshold is the value of 85 grams of gold. If net assets fall below this, Zakah is not obligatory.',
      },
      {
        label: 'Business Rate',
        detail:
          'Zakah on business and trade assets is 2.5% of net Zakatable assets annually.',
      },
    ],
    color: 'gold',
  },
  {
    id: 'ss50',
    title: 'SS (50)',
    subtitle: 'Zakah on Agricultural Output',
    summary: 'Differentiated Zakah rates based on irrigation method',
    rationale:
      'Agricultural output is subject to Zakah at varying rates depending on the cost and effort of irrigation, reflecting the principle that divine provision (rain) carries a higher obligation.',
    rules: [
      {
        label: 'Rain-Fed / Natural',
        detail:
          'Crops irrigated by rain, rivers, or springs: Zakah rate is 10% of the harvest.',
      },
      {
        label: 'Mechanical Irrigation',
        detail:
          'Crops irrigated by paid means (pumps, wells, canals): Zakah rate is 5% of the harvest.',
      },
    ],
    color: 'crimson',
  },
]

const COLOR_MAP = {
  gold: {
    border: 'var(--gold)',
    bg: 'rgba(201, 168, 76, 0.06)',
    badge: 'rgba(201, 168, 76, 0.12)',
    text: 'var(--gold)',
  },
  teal: {
    border: 'var(--teal)',
    bg: 'rgba(42, 157, 143, 0.06)',
    badge: 'rgba(42, 157, 143, 0.12)',
    text: 'var(--teal-text)',
  },
  crimson: {
    border: 'var(--crimson)',
    bg: 'rgba(192, 57, 43, 0.06)',
    badge: 'rgba(192, 57, 43, 0.12)',
    text: 'var(--crimson-text)',
  },
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="flex-shrink-0 transition-transform duration-300"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}

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
          const colors = COLOR_MAP[std.color]

          return (
            <div
              key={std.id}
              className="card overflow-hidden"
              style={{
                borderLeftWidth: '3px',
                borderLeftColor: colors.border,
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
                      style={{ background: colors.badge, color: colors.text }}
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
                style={{
                  maxHeight: open ? '600px' : '0px',
                  opacity: open ? 1 : 0,
                }}
              >
                <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0">
                  <div
                    className="rounded-lg p-4 mb-4"
                    style={{ background: colors.bg }}
                  >
                    <p className="text-body text-sm leading-relaxed italic">
                      {std.rationale}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {std.rules.map((rule, ri) => (
                      <div
                        key={ri}
                        className="flex gap-3"
                        style={{ animation: open ? `slideIn 0.25s ease-out ${ri * 60}ms both` : 'none' }}
                      >
                        <div
                          className="w-1.5 rounded-full flex-shrink-0 mt-1"
                          style={{ background: colors.border, height: '16px' }}
                        />
                        <div>
                          <p className="text-heading text-sm font-medium mb-0.5">
                            {rule.label}
                          </p>
                          <p className="text-dim text-sm leading-relaxed">
                            {rule.detail}
                          </p>
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
