import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tijara — AAOIFI Shari\'ah Compliance Engine',
  description: 'Shari\'ah-compliant equity screening, contract validation, and Zakah computation per AAOIFI Standards (2017 Edition). Built by Modan Financial Group.',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="geometric-bg" />
        <div className="grain-overlay" />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}
