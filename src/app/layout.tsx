import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { isIS } from '@clerk/localizations'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { AppHeader } from '@/components/AppHeader'
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
    <ClerkProvider localization={isIS} signInUrl="/sign-in" signUpUrl="/sign-up">
    <html lang="en">
      <body className={`${spaceGrotesk.className} christmas min-h-screen flex flex-col`} suppressHydrationWarning>
        <Providers>
          <AppHeader />
          <main className="flex-1">
            {children}
          </main>
          <ThemeFooter />
        </Providers>
        <ChristmasDecor />
      </body>
    </html>
    </ClerkProvider>
  )
}
