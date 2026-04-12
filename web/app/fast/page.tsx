'use client'

import StockScreener from '../components/StockScreener'
import ThemeToggle from '../components/ThemeToggle'

export default function FastPage() {
  return (
    <main className="min-h-screen flex flex-col">
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
                  <span className="text-dim text-lg sm:text-2xl font-light ml-3">Fast</span>
                </h1>
                <p className="text-label text-[10px] sm:text-sm tracking-[0.15em] sm:tracking-[0.2em] uppercase mt-0.5 sm:mt-1 font-light">
                  Database-Only Screening
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <StockScreener fast />
        </div>
      </div>
    </main>
  )
}
