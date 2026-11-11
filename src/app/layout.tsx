import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { isIS } from '@clerk/localizations'
import { Bricolage_Grotesque } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { AppHeader } from '@/components/AppHeader'
import { ChristmasDecor } from '@/components/ChristmasDecor'

const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Hreðjar Bjórsmakk',
  description: 'Synchronized beer tasting ratings for groups of friends',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    // iOS ignores SVG touch icons
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Bjórsmakk',
    statusBarStyle: 'black',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#123A2C',
  // No maximumScale/userScalable: pinch-zoom must stay available for people who need larger text
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      localization={isIS}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={{
        variables: {
          colorPrimary: '#C8323A',
          colorPrimaryForeground: '#FFFFFF',
          colorBackground: '#FBF6EA',
          colorForeground: '#1E1B16',
          colorMutedForeground: '#5E574A',
          colorInput: '#FFFFFF',
          colorInputForeground: '#1E1B16',
          colorBorder: '#CDBE9C',
          colorRing: '#F2A93B',
          fontFamily: 'var(--font-sans)',
          borderRadius: '0.875rem',
        },
        // Clerk's card has a fixed width; let it shrink and wrap on small phones with large text
        elements: {
          rootBox: 'w-full max-w-full',
          cardBox: 'w-full max-w-full',
          card: '!px-4 sm:!px-10',
          footerAction: '!px-4',
          footerActionLink: 'inline-block py-1.5',
        },
      }}
    >
    <html lang="is">
      <body className={`${bricolage.variable} font-sans min-h-dvh flex flex-col`} suppressHydrationWarning>
        <Providers>
          <AppHeader />
          {/*
            iOS 26 Safari fades whatever sits under the status bar unless a solid fixed element touches the top edge,
            and the phone header scrolls away. This strip gives Safari a solid colour to sample; it is header-coloured and
            only as tall as the header's top padding, so it's invisible until you scroll.
          */}
          <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1 bg-background sm:hidden" />
          <main className="flex-1">
            {children}
          </main>
        </Providers>
        <ChristmasDecor />
      </body>
    </html>
    </ClerkProvider>
  )
}
