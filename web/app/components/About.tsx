'use client'

export default function About() {
  return (
    <div className="space-y-16">
      {/* Hero section */}
      <section>
        <h2 className="font-display text-3xl md:text-4xl text-heading font-light leading-tight">
          Why <span className="text-gold-gradient font-medium">Halal Investing</span> Matters
        </h2>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 text-label text-[15px] leading-relaxed">
            <p>
              For Muslims, wealth is a trust (<span className="text-body italic">amanah</span>) from
              Allah. How we earn, grow, and spend it is not merely a financial decision &mdash; it is a
              reflection of our faith. Investing in companies that profit from interest (Riba), alcohol,
              gambling, or other prohibited activities directly contradicts the principles of Shari&rsquo;ah.
            </p>
            <p>
              Halal investing ensures your portfolio aligns with Islamic values: that your returns come from
              <span className="text-body"> real economic activity</span>, not from exploitation, harm, or
              interest-based instruments. It is both a spiritual obligation and a commitment to ethical capitalism.
            </p>
            <p>
              The Accounting and Auditing Organization for Islamic Financial Institutions
              (<a href="https://aaoifi.com/?lang=en" target="_blank" rel="noopener noreferrer" className="text-accent font-medium underline underline-offset-2 decoration-gold/30 hover:decoration-gold/60 transition-colors">AAOIFI</a>) provides the globally recognized
              standards that define what constitutes a Shari&rsquo;ah-compliant investment. Tijara automates
              these standards to give investors a clearer direction &mdash; though all results should be
              verified with a qualified Shari&rsquo;ah scholar before making investment decisions.
            </p>
          </div>
          <div className="space-y-4 text-label text-[15px] leading-relaxed">
            <p>
              Without a rigorous screening process, it is nearly impossible for individual investors to
              verify compliance across hundreds of publicly traded companies. Financial statements must be
              analyzed, sector classifications reviewed, and precise ratios calculated against AAOIFI thresholds.
            </p>
            <p>
              <span className="text-body font-medium">Tijara was built to help with this process.</span> It
              serves as a directional screening tool based on AAOIFI thresholds. Results should be treated as
              a starting point for further due diligence &mdash; not as a definitive ruling. A stock flagged as
              compliant still warrants review by a qualified scholar, and one flagged as non-compliant may have
              circumstances the automated screening cannot account for.
            </p>
            <p className="text-dim text-sm border-l-2 border-gold/20 pl-4 italic">
              &ldquo;O you who believe, do not consume one another&rsquo;s wealth unjustly, but only in
              lawful business by mutual consent.&rdquo;
              <br />
              <span className="text-ghost not-italic">&mdash; Qur&rsquo;an 4:29</span>
            </p>
          </div>
        </div>
      </section>

      {/* Algorithm breakdown */}
      <section>
        <h3 className="font-display text-2xl text-heading font-light mb-2">
          The Screening Algorithm
        </h3>
        <p className="text-dim text-sm mb-8 max-w-2xl">
          Every equity passes through a multi-stage compliance pipeline. Each gate is a hard constraint &mdash;
          a single failure terminates the process.
        </p>

        <div className="space-y-4">
          <PipelineStage
            number="01"
            title="Qualitative Sector Filter"
            standard="SS (21)"
            status="BINARY HARD STOP"
            description="Company sector and industry are checked against the AAOIFI prohibition list. Any match in conventional finance (Riba), alcohol, pork, or gambling results in immediate rejection."
            criteria={[
              'Conventional Finance & Insurance (Riba)',
              'Alcohol production, trade, or distribution',
              'Pork-related products & processing',
              'Gambling, casinos, & gaming technology',
            ]}
            color="crimson"
          />

          <PipelineStage
            number="02"
            title="Quantitative Financial Ratios"
            standard="SS (21)"
            status="THREE RATIO GATES"
            description="If the sector passes, three financial ratios are computed against the company's market capitalization and income. Each is an independent hard constraint."
            criteria={[
              'Total Debt / Market Cap \u2264 30%',
              'Interest-Bearing Deposits / Market Cap \u2264 30%',
              'Prohibited Income / Total Income \u2264 5%',
            ]}
            color="gold"
          />

          <PipelineStage
            number="03"
            title="Tangible Asset Composition"
            standard="SS (21)"
            status="TANGIBILITY GATE"
            description="Ensures the company represents real economic activity, not a disguised exchange of money for money. Cash and receivables must not dominate the balance sheet."
            criteria={[
              'Tangible Assets \u2265 30% of Total Assets',
              'Monetary Assets (Cash + Receivables) \u2264 70%',
            ]}
            color="teal"
          />

          {/* Result */}
          <div className="flex justify-center py-4">
            <div className="card px-8 py-5 border-gold/30 bg-gradient-to-r from-gold/[0.04] via-gold/[0.08] to-gold/[0.04] text-center">
              <div className="text-accent-dim text-xs uppercase tracking-[0.2em] mb-1">All Gates Passed</div>
              <div className="font-display text-2xl text-gold-gradient font-medium">COMPLIANT</div>
              <div className="text-dim text-xs mt-1">Transaction Permitted</div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional modules */}
      <section>
        <h3 className="font-display text-2xl text-heading font-light mb-6">
          Beyond Equity Screening
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center flex-shrink-0">
                <span className="text-pass text-lg">&#9878;</span>
              </div>
              <div>
                <h4 className="text-body font-medium">Contract Validation</h4>
                <p className="text-dim text-xs">SS (12) Musharakah &middot; SS (13) Mudarabah</p>
              </div>
            </div>
            <p className="text-label text-sm leading-relaxed">
              Validates partnership contracts to ensure profit is distributed as a percentage of actual
              net profit (not fixed sums or capital percentages) and that losses follow capital
              contribution ratios exactly.
            </p>
          </div>
          <div className="card p-6">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                <span className="text-accent text-lg">&#9670;</span>
              </div>
              <div>
                <h4 className="text-body font-medium">Zakah Computation</h4>
                <p className="text-dim text-xs">SS (35) Zakah &middot; SS (50) Musaqat</p>
              </div>
            </div>
            <p className="text-label text-sm leading-relaxed">
              Computes Zakah obligation based on the gold Nisab threshold (85 grams). Supports
              business assets (2.5%), rain-fed agriculture (10%), and mechanically irrigated
              agriculture (5%).
            </p>
          </div>
        </div>
      </section>

      {/* Data sources */}
      <section>
        <h3 className="font-display text-2xl text-heading font-light mb-2">
          Data Sources &amp; APIs
        </h3>
        <p className="text-dim text-sm mb-6 max-w-2xl">
          Tijara currently uses free, publicly available financial data APIs.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5">
            <div className="text-accent-dim text-xs uppercase tracking-wider mb-2">Financial Data</div>
            <h4 className="text-body font-medium mb-1">Yahoo Finance API</h4>
            <p className="text-dim text-sm leading-relaxed">
              Balance sheets, income statements, market capitalization, and sector/industry classifications
              for publicly traded equities worldwide.
            </p>
            <div className="mt-3 inline-block px-2.5 py-1 rounded bg-teal/10 border border-teal/20 text-pass text-xs">
              Active
            </div>
          </div>
          <div className="card p-5">
            <div className="text-accent-dim text-xs uppercase tracking-wider mb-2">Coming Soon</div>
            <h4 className="text-body font-medium mb-1">Tijara API</h4>
            <p className="text-dim text-sm leading-relaxed">
              A public API for developers to integrate Shari&rsquo;ah compliance screening
              directly into their own applications and platforms.
            </p>
            <div className="mt-3 inline-block px-2.5 py-1 rounded bg-accent-soft border text-dim text-xs" style={{ borderColor: 'var(--border-primary)' }}>
              Planned
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="text-center py-8">
        <div className="card p-8 sm:p-10 max-w-xl mx-auto border-gold/15">
          <h3 className="font-display text-2xl text-heading font-light mb-3">Get in Touch</h3>
          <p className="text-label text-sm mb-6 leading-relaxed">
            Have a recommendation or found a bug? We&rsquo;d love to hear from you.
          </p>
          <a
            href="mailto:adilmodanfinances@gmail.com"
            className="btn-primary inline-flex items-center gap-2.5 max-w-full text-sm sm:text-base"
            style={{ wordBreak: 'break-all' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M22 4L12 13L2 4"/>
            </svg>
            adilmodanfinances@gmail.com
          </a>
        </div>
      </section>
    </div>
  )
}

const STAGE_COLORS = {
  crimson: { border: 'border-crimson/20 hover:border-crimson/35', accent: 'text-fail', bg: 'bg-crimson/8', dot: 'bg-crimson' },
  gold:    { border: 'border-gold/20 hover:border-gold/35',       accent: 'text-accent', bg: 'bg-gold/8',    dot: 'bg-gold' },
  teal:    { border: 'border-teal/20 hover:border-teal/35',       accent: 'text-pass',   bg: 'bg-teal/8',    dot: 'bg-teal' },
} as const

function PipelineStage({ number, title, standard, status, description, criteria, color }: {
  number: string
  title: string
  standard: string
  status: string
  description: string
  criteria: string[]
  color: keyof typeof STAGE_COLORS
}) {
  const s = STAGE_COLORS[color]

  return (
    <div className={`card p-6 ${s.border} transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`font-display text-2xl font-bold ${s.accent} opacity-40`}>{number}</span>
          <div>
            <h4 className="text-body font-medium text-[15px]">{title}</h4>
            <p className="text-dim text-xs">{standard}</p>
          </div>
        </div>
        <span className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded ${s.bg} ${s.accent}`}>
          {status}
        </span>
      </div>
      <p className="text-label text-sm leading-relaxed mb-4">{description}</p>
      <div className="space-y-2">
        {criteria.map((c, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className={`w-1.5 h-1.5 rounded-full ${s.dot} mt-1.5 flex-shrink-0 opacity-60`} />
            <span className="text-label text-sm">{c}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
