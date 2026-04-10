import type { Metadata } from 'next'
import LegalLayout from '../components/LegalLayout'

export const metadata: Metadata = {
  title: 'Terms of Service — Tijara',
  description: 'Terms and conditions for using the Tijara Shari\'ah Compliance Engine.',
}

export default function TermsPage() {
  return (
    <LegalLayout>
      <article className="space-y-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-heading font-light">Terms of Service</h1>
          <p className="text-dim text-sm mt-2">Last updated: April 9, 2026</p>
        </div>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">1. Acceptance of Terms</h2>
          <p>
            By accessing or using Tijara (the &ldquo;Service&rdquo;), operated by Modan Financial Group
            (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you agree to be bound by these
            Terms of Service. If you do not agree, do not use the Service.
          </p>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">2. Description of Service</h2>
          <p>
            Tijara is a free, publicly accessible Shari&rsquo;ah compliance screening tool that:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-label">
            <li>Screens publicly traded equities against AAOIFI Shari&rsquo;ah Standards (2017 Edition)</li>
            <li>Validates Musharakah and Mudarabah partnership contract terms</li>
            <li>Computes Zakah obligations based on asset values and gold Nisab thresholds</li>
          </ul>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">3. Important Disclaimers</h2>
          <div className="card p-5 border-gold/20 bg-gradient-to-r from-gold/[0.03] to-transparent">
            <p className="text-body text-sm leading-relaxed">
              <strong className="text-accent">This tool is for informational purposes only.</strong> Tijara
              does not constitute financial advice, investment advice, religious advice, or a fatwa. The
              screening results are based on automated analysis of publicly available financial data and
              predetermined AAOIFI thresholds.
            </p>
          </div>
          <ul className="list-disc list-inside space-y-2 text-label mt-4">
            <li>
              <strong className="text-body">No guarantee of accuracy.</strong> Financial data is sourced
              from Yahoo Finance and may be delayed, incomplete, or inaccurate. We do not independently
              verify the underlying data.
            </li>
            <li>
              <strong className="text-body">Not a substitute for scholarly guidance.</strong> Users should
              consult qualified Shari&rsquo;ah scholars or advisors before making investment decisions based
              on screening results.
            </li>
            <li>
              <strong className="text-body">Standards version.</strong> This engine was developed using
              AAOIFI Shari&rsquo;ah Standards as of Shawwal 22, 1447 AH (2017 Edition) and may not reflect
              subsequent updates or amendments.
            </li>
            <li>
              <strong className="text-body">No liability.</strong> Modan Financial Group shall not be
              liable for any financial losses, spiritual harm, or other damages arising from the use of
              or reliance on screening results produced by this Service.
            </li>
          </ul>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">4. Permitted Use</h2>
          <p>You may use the Service for:</p>
          <ul className="list-disc list-inside space-y-1.5 text-label">
            <li>Personal research and due diligence on equity investments</li>
            <li>Educational purposes related to Islamic finance</li>
            <li>Preliminary compliance checks (subject to professional verification)</li>
          </ul>
          <p className="mt-4">You may <strong className="text-body">not</strong>:</p>
          <ul className="list-disc list-inside space-y-1.5 text-label">
            <li>Use automated tools to scrape or mass-query the Service</li>
            <li>Redistribute screening results as a commercial product or paid service</li>
            <li>Misrepresent the Service&rsquo;s output as a formal Shari&rsquo;ah certification or fatwa</li>
            <li>Attempt to circumvent rate limits or security measures</li>
          </ul>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">5. Intellectual Property</h2>
          <p>
            The Tijara name, logo, design system, and screening engine code are the property of
            Modan Financial Group. The AAOIFI standards referenced are the intellectual property
            of the Accounting and Auditing Organization for Islamic Financial Institutions.
          </p>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">6. Service Availability</h2>
          <p>
            The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis.
            We do not guarantee uninterrupted access. We reserve the right to modify, suspend, or
            discontinue the Service at any time without notice.
          </p>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">7. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, Modan Financial Group and its operators
            shall not be liable for any indirect, incidental, special, consequential, or punitive damages,
            including but not limited to loss of profits, data, or goodwill, arising from your use of
            the Service.
          </p>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">8. Changes to Terms</h2>
          <p>
            We reserve the right to update these Terms at any time. Material changes will be reflected
            by updating the &ldquo;Last updated&rdquo; date. Continued use after changes constitutes
            acceptance.
          </p>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">9. Contact</h2>
          <p>
            For questions about these Terms, contact us at{' '}
            <a href="mailto:adilmodanfinances@gmail.com" className="text-accent-dim underline underline-offset-2 decoration-gold/20 hover:text-gold transition-colors">
              adilmodanfinances@gmail.com
            </a>.
          </p>
        </section>
      </article>
    </LegalLayout>
  )
}
