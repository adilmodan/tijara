import type { Metadata } from 'next'
import LegalLayout from '../components/LegalLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy — Tijara',
  description: 'How Tijara handles your data and protects your privacy.',
}

export default function PrivacyPage() {
  return (
    <LegalLayout>
      <article className="space-y-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-heading font-light">Privacy Policy</h1>
          <p className="text-dim text-sm mt-2">Last updated: April 9, 2026</p>
        </div>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">1. Overview</h2>
          <p>
            Tijara (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is operated by Modan Financial Group.
            This Privacy Policy explains how we collect, use, and protect information when you use the Tijara
            Shari&rsquo;ah Compliance Engine (the &ldquo;Service&rdquo;) at tijara.vercel.app.
          </p>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">2. Information We Collect</h2>
          <h3 className="text-body text-sm font-medium uppercase tracking-wider">Data You Provide</h3>
          <ul className="list-disc list-inside space-y-1.5 text-label">
            <li>Ticker symbols entered for equity screening</li>
            <li>Financial figures entered for manual screening, contract validation, or Zakah computation</li>
          </ul>
          <h3 className="text-body text-sm font-medium uppercase tracking-wider mt-4">Data Collected Automatically</h3>
          <ul className="list-disc list-inside space-y-1.5 text-label">
            <li>Standard web server logs (IP address, browser type, access timestamps) collected by our hosting provider (Vercel)</li>
            <li>Theme preference stored locally in your browser via <code className="text-accent-dim text-sm">localStorage</code></li>
          </ul>
          <h3 className="text-body text-sm font-medium uppercase tracking-wider mt-4">Data We Do NOT Collect</h3>
          <ul className="list-disc list-inside space-y-1.5 text-label">
            <li>We do not collect names, email addresses, or account information (there is no user registration)</li>
            <li>We do not use analytics tracking, pixel trackers, or advertising cookies</li>
            <li>We do not store your screening inputs or results on our servers</li>
          </ul>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">3. How We Use Information</h2>
          <p>
            Ticker symbols you enter are sent to Yahoo Finance&rsquo;s public API solely to retrieve
            financial data for screening. This data is processed in real-time and is not stored.
            Contract validation and Zakah computation run entirely in your browser &mdash; no data
            leaves your device for these features.
          </p>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">4. Third-Party Services</h2>
          <ul className="list-disc list-inside space-y-1.5 text-label">
            <li><strong className="text-body">Vercel</strong> — Hosting and serverless function execution. Subject to <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent-dim underline underline-offset-2 decoration-gold/20 hover:text-gold transition-colors">Vercel&rsquo;s Privacy Policy</a>.</li>
            <li><strong className="text-body">Yahoo Finance</strong> — Financial data retrieval for equity screening. No personally identifiable information is transmitted.</li>
            <li><strong className="text-body">Google Fonts</strong> — Font delivery (Cormorant Garamond, Outfit). Subject to <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-dim underline underline-offset-2 decoration-gold/20 hover:text-gold transition-colors">Google&rsquo;s Privacy Policy</a>.</li>
          </ul>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">5. Data Retention</h2>
          <p>
            We do not persist any user-submitted data. Screening inputs exist only for the duration
            of the HTTP request (equity screening) or browser session (contract/Zakah). Theme preferences
            persist in your browser&rsquo;s <code className="text-accent-dim text-sm">localStorage</code> until you clear it.
          </p>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">6. Security</h2>
          <p>
            All traffic is encrypted via HTTPS/TLS. We follow industry-standard practices for
            securing our hosting environment. Since we do not store personal data, the risk
            surface is minimal.
          </p>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">7. Children&rsquo;s Privacy</h2>
          <p>
            The Service is not directed at individuals under the age of 13. We do not knowingly
            collect information from children.
          </p>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be reflected by updating
            the &ldquo;Last updated&rdquo; date at the top of this page. Continued use of the Service
            after changes constitutes acceptance of the revised policy.
          </p>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">9. Contact</h2>
          <p>
            For privacy-related inquiries, contact us at{' '}
            <a href="mailto:adilmodanfinances@gmail.com" className="text-accent-dim underline underline-offset-2 decoration-gold/20 hover:text-gold transition-colors">
              adilmodanfinances@gmail.com
            </a>.
          </p>
        </section>
      </article>
    </LegalLayout>
  )
}
