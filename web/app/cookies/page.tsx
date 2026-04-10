import type { Metadata } from 'next'
import LegalLayout from '../components/LegalLayout'

export const metadata: Metadata = {
  title: 'Cookie Policy — Tijara',
  description: 'How Tijara uses cookies and browser storage.',
}

export default function CookiesPage() {
  return (
    <LegalLayout>
      <article className="space-y-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-heading font-light">Cookie Policy</h1>
          <p className="text-dim text-sm mt-2">Last updated: April 9, 2026</p>
        </div>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">1. What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device by your web browser. They are widely
            used to make websites work efficiently and to provide information to site operators.
            Related technologies include <code className="text-accent-dim text-sm">localStorage</code> and{' '}
            <code className="text-accent-dim text-sm">sessionStorage</code>, which serve similar purposes.
          </p>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">2. How Tijara Uses Browser Storage</h2>
          <p>
            Tijara uses <strong className="text-body">minimal browser storage</strong>. We do not set
            any cookies directly. Our only use of browser storage is:
          </p>

          <div className="card p-5 mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-label text-xs uppercase tracking-wider border-b border-gold/10">
                  <th className="text-left py-2 pr-4">Storage Key</th>
                  <th className="text-left py-2 pr-4">Type</th>
                  <th className="text-left py-2 pr-4">Purpose</th>
                  <th className="text-left py-2">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gold/5">
                  <td className="py-3 pr-4"><code className="text-accent-dim">tijara-theme</code></td>
                  <td className="py-3 pr-4 text-label">localStorage</td>
                  <td className="py-3 pr-4 text-label">Remembers your dark/light mode preference</td>
                  <td className="py-3 text-label">Until cleared</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4">
            This is classified as a <strong className="text-body">strictly necessary</strong> functional
            preference and does not require consent under most privacy regulations (GDPR, ePrivacy Directive)
            as it does not track users or transmit data to third parties.
          </p>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">3. Third-Party Cookies</h2>
          <p>Tijara does not set or use any third-party cookies. However, third-party services we rely on may set their own:</p>
          <ul className="list-disc list-inside space-y-1.5 text-label">
            <li><strong className="text-body">Vercel</strong> (hosting) — may set infrastructure cookies for load balancing and security. See <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent-dim underline underline-offset-2 decoration-gold/20 hover:text-gold transition-colors">Vercel&rsquo;s Privacy Policy</a>.</li>
            <li><strong className="text-body">Google Fonts</strong> (font delivery) — may log standard request data. See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-dim underline underline-offset-2 decoration-gold/20 hover:text-gold transition-colors">Google&rsquo;s Privacy Policy</a>.</li>
          </ul>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">4. What We Do NOT Use</h2>
          <ul className="list-disc list-inside space-y-1.5 text-label">
            <li>No analytics cookies (Google Analytics, Mixpanel, etc.)</li>
            <li>No advertising or retargeting cookies</li>
            <li>No social media tracking pixels</li>
            <li>No fingerprinting or cross-site tracking</li>
          </ul>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">5. Managing Storage</h2>
          <p>
            You can clear the <code className="text-accent-dim text-sm">tijara-theme</code> preference at any time
            by clearing your browser&rsquo;s localStorage for this site, or by using your browser&rsquo;s
            &ldquo;Clear Site Data&rdquo; function. The theme will revert to dark mode (default).
          </p>
        </section>

        <section className="space-y-4 text-label text-[15px] leading-relaxed">
          <h2 className="font-display text-xl text-body font-light">6. Contact</h2>
          <p>
            For questions about our cookie practices, contact us at{' '}
            <a href="mailto:adilmodanfinances@gmail.com" className="text-accent-dim underline underline-offset-2 decoration-gold/20 hover:text-gold transition-colors">
              adilmodanfinances@gmail.com
            </a>.
          </p>
        </section>
      </article>
    </LegalLayout>
  )
}
