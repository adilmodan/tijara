'use client'

import { useState } from 'react'
import Link from 'next/link'
import StockScreener from './components/StockScreener'
import ZakahCalculator from './components/ZakahCalculator'
import Standards from './components/Standards'
import About from './components/About'
import ThemeToggle from './components/ThemeToggle'
import NewsletterPopup from './components/NewsletterPopup'

type Tab = 'stock' | 'zakah' | 'standards' | 'about'

const TAB_LABELS: Record<Tab, string> = {
  stock: 'Equity Screening',
  zakah: 'Zakah Engine',
  standards: 'Standards',
  about: 'About',
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('stock')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main className="min-h-screen flex flex-col">
      <NewsletterPopup />
      {/* Disclaimer banner */}
      <div className="bg-gold/[0.06] border-b border-gold/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-1.5 sm:py-2.5 text-center">
          <p className="text-dim text-[10px] sm:text-xs leading-relaxed">
            <span className="text-accent-dim font-medium">Disclaimer:</span>{' '}
            This engine was developed using{' '}
            <a href="https://aaoifi.com/?lang=en" target="_blank" rel="noopener noreferrer" className="text-body underline underline-offset-2 decoration-gold/20 hover:decoration-gold/40 transition-colors">AAOIFI</a>{' '}
            Shari&rsquo;ah Standards as of{' '}
            <span className="text-body">Shawwal 22, 1447 AH</span>.
            Results are directional and should be verified with a qualified Shari&rsquo;ah scholar.
            This tool does not constitute financial or religious advice.
          </p>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-gold/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 sm:gap-5">
            <div className="relative flex-shrink-0">
              <img src="/logo-sm.png" alt="Tijara" className="w-11 h-11 sm:w-16 sm:h-16 object-contain" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-light tracking-wide">
                <span className="text-gold-gradient font-medium">Tijara</span>
              </h1>
              <p className="text-label text-[10px] sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase mt-0.5 sm:mt-1 font-light">
                AAOIFI Shari&rsquo;ah Compliance Engine
              </p>
              <p className="text-ghost text-xs mt-2 max-w-lg leading-relaxed hidden sm:block">
                Binary compliance verification against AAOIFI Shari&rsquo;ah Standards (2017 Edition).
                Equity screening per SS (21) &middot; Zakah computation per SS (35/50) &middot; Standards reference per SS (12/13).
              </p>
            </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-gold/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Desktop tabs */}
          <div className="hidden sm:flex gap-1">
            {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`tab ${activeTab === tab ? 'active' : ''}`}>
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
          {/* Mobile hamburger */}
          <div className="flex sm:hidden items-center justify-between py-3">
            <span className="text-body text-sm font-medium">{TAB_LABELS[activeTab]}</span>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 -mr-2 text-label hover:text-body transition-colors"
              aria-label="Toggle menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {menuOpen ? (
                  <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                ) : (
                  <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
                )}
              </svg>
            </button>
          </div>
          {menuOpen && (
            <div className="sm:hidden border-t border-gold/10 pb-3">
              {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setMenuOpen(false) }}
                  className={`block w-full text-left px-3 py-2.5 text-sm rounded transition-colors ${
                    activeTab === tab ? 'text-accent bg-gold/[0.08]' : 'text-label hover:text-body hover:bg-gold/[0.04]'
                  }`}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex-1 w-full">
        <div className="animate-fade-in">
          {activeTab === 'stock' && <StockScreener />}
          {activeTab === 'zakah' && <ZakahCalculator />}
          {activeTab === 'standards' && <Standards />}
          {activeTab === 'about' && <About />}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gold/10 mt-10 sm:mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <img src="/logo-sm.png" alt="Tijara" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
              <div>
                <p className="text-body text-xs sm:text-sm font-medium">
                  Built by{' '}
                  <a
                    href="https://adilmodan.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:text-gold-light transition-colors underline decoration-gold/30 underline-offset-2"
                  >
                    Modan Financial Group
                  </a>
                </p>
                <p className="text-dim text-[10px] sm:text-xs mt-0.5">Shari&rsquo;ah-First Financial Technology</p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <a
                href="mailto:adilmodanfinances@gmail.com"
                className="text-label hover:text-accent text-xs sm:text-sm transition-colors"
              >
                Contact Us
              </a>
              <span className="text-ghost hidden sm:inline">|</span>
              <span className="text-dim text-[10px] sm:text-xs hidden sm:inline">Standards: AAOIFI SS (12) (13) (21) (35) (50)</span>
            </div>
          </div>
          <div className="border-t border-gold/5 pt-3 sm:pt-4 flex flex-col sm:flex-row justify-between items-center gap-1.5 sm:gap-2">
            <p className="text-ghost text-[10px] sm:text-xs">
              Tijara Compliance Engine v0.1.0 &middot; Shawwal 22, 1447 AH
            </p>
            <div className="flex items-center gap-3 text-ghost text-[10px] sm:text-xs">
              <Link href="/privacy" className="hover:text-label transition-colors">Privacy</Link>
              <span>&middot;</span>
              <Link href="/cookies" className="hover:text-label transition-colors">Cookies</Link>
              <span>&middot;</span>
              <Link href="/terms" className="hover:text-label transition-colors">Terms</Link>
            </div>
            <p className="text-ghost text-[10px] sm:text-xs">
              For informational purposes only. Not financial or religious advice.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
