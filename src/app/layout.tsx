import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { ReturnToTastingButton } from '@/components/ReturnToTastingButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Hreðjar Bjórsmakk',
  description: 'Synchronized beer tasting ratings for groups of friends',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
        <ReturnToTastingButton />
      </body>
    </html>
  )
}
