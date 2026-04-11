'use client'

import { useState, useEffect } from 'react'

const DISMISS_KEY = 'tijara-newsletter-dismissed'
const POPUP_DELAY_MS = 8_000

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed) return

    const timer = setTimeout(() => setVisible(true), POPUP_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setStatus('success')
      setTimeout(dismiss, 2500)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setStatus('error')
    }
  }

  if (!visible) return null

  return (
    <div className="newsletter-overlay" onClick={dismiss}>
      <div
        className="newsletter-popup card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-label hover:text-body transition-colors p-1"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {status === 'success' ? (
          <div className="text-center py-4 animate-fade-in">
            <div className="text-pass text-2xl mb-2">&#10003;</div>
            <p className="text-heading text-sm font-medium">You&rsquo;re on the list.</p>
            <p className="text-dim text-xs mt-1">We&rsquo;ll be in touch.</p>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <p className="text-accent text-xs uppercase tracking-widest font-semibold mb-2">
                Newsletter
              </p>
              <h3 className="font-display text-xl sm:text-2xl text-heading font-light leading-snug">
                Halal Investing Insights
              </h3>
              <p className="text-dim text-sm mt-2 leading-relaxed">
                Shari&rsquo;ah-compliant market analysis, screening updates, and
                educational content delivered to your inbox.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="email"
                className="input-field flex-1 text-sm"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary text-sm px-5 whitespace-nowrap"
              >
                {status === 'loading' ? <span className="spinner" /> : 'Subscribe'}
              </button>
            </form>

            {errorMsg && (
              <p className="text-fail text-xs mt-2">{errorMsg}</p>
            )}

            <p className="text-ghost text-[10px] mt-3">
              No spam. Unsubscribe anytime.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
