import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MooTracker PROFI',
  description: 'Szarvasmarhatartó telep modern webes irányítási rendszere',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="hu">
      <body>{children}</body>
    </html>
  )
}
