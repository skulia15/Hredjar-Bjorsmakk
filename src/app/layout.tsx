import type { Metadata, Viewport } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { ReturnToTastingButton } from '@/components/ReturnToTastingButton'
import { UserDisplay } from '@/components/UserDisplay'
import { ThemeFooter } from '@/components/ThemeFooter'
import { ChristmasDecor } from '@/components/ChristmasDecor'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '700'] })

export const metadata: Metadata = {
  title: 'Hreðjar Bjórsmakk',
  description: 'Synchronized beer tasting ratings for groups of friends',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.className} christmas min-h-screen flex flex-col`} suppressHydrationWarning>
        <Providers>
          <main className="flex-1">
            {children}
          </main>
          <ThemeFooter />
        </Providers>
        <ChristmasDecor />
        <ReturnToTastingButton />
        <UserDisplay />
      </body>
    </html>
  )
}
