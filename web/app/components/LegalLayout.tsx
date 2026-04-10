import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="border-b border-gold/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo-sm.png" alt="Tijara" className="w-10 h-10 object-contain" />
            <span className="font-display text-xl text-gold-gradient font-medium group-hover:opacity-80 transition-opacity">Tijara</span>
          </Link>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        {children}
      </div>
      <footer className="border-t border-gold/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="text-accent-dim text-sm hover:text-accent transition-colors">&larr; Back to Tijara</Link>
          <div className="flex items-center gap-4 text-dim text-xs">
            <Link href="/privacy" className="hover:text-label transition-colors">Privacy</Link>
            <span>|</span>
            <Link href="/cookies" className="hover:text-label transition-colors">Cookies</Link>
            <span>|</span>
            <Link href="/terms" className="hover:text-label transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
