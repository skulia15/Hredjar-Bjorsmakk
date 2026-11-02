'use client'

import { SignInButton, Show, useAuth } from '@clerk/nextjs'
import { Beer as BeerIcon, ListChecks, Shield, Tv } from 'lucide-react'
import { AccountMenu } from '@/components/AccountMenu'
import { NicknameForm } from '@/components/NicknameForm'
import { SantaMug } from '@/components/SantaMug'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getActiveTastingId, useActiveTasting } from '@/hooks/useActiveTasting'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/tastings', label: 'Smakkanir', icon: ListChecks },
  { href: '/beers', label: 'Bjórlisti', icon: BeerIcon },
  { href: '/projector', label: 'Skjávarpi', icon: Tv },
]
const ADMIN_ITEM = { href: '/admin/users', label: 'Notendur', icon: Shield }

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppHeader() {
  const pathname = usePathname() ?? '/'
  const { isSignedIn } = useAuth()
  const { clearActiveTasting } = useActiveTasting()
  const [session, setSession] = useState<{ userId: string; name: string; isAdmin: boolean } | null>(null)
  const [activeTastingId, setActiveTastingId] = useState<string | null>(null)
  const [isEmbedded, setIsEmbedded] = useState(false)
  const [editingName, setEditingName] = useState(false)

  useEffect(() => {
    setIsEmbedded(window.self !== window.top)
  }, [])

  useEffect(() => {
    if (!isSignedIn) {
      setSession(null)
      return
    }
    fetch('/api/session')
      .then(res => res.json())
      .then(data => setSession(data.hasSession ? { userId: data.userId, name: data.name, isAdmin: data.isAdmin } : null))
      .catch(err => console.error('Error loading session:', err))
  }, [isSignedIn])

  useEffect(() => {
    const verify = async () => {
      const stored = getActiveTastingId()
      if (!stored) {
        setActiveTastingId(null)
        return
      }
      try {
        const response = await fetch(`/api/tastings/${stored}`)
        const data = response.ok ? await response.json() : null
        if (data?.status === 'active') {
          setActiveTastingId(stored)
        } else {
          setActiveTastingId(null)
          clearActiveTasting()
        }
      } catch (error) {
        console.error('Error checking tasting status:', error)
      }
    }

    verify()
    window.addEventListener('storage', verify)
    return () => window.removeEventListener('storage', verify)
  }, [clearActiveTasting])

  // Projector display is fullscreen; embedded views live inside another page; while rating a
  // beer people only need the tasting itself (the tasting tabs still lead to scores and admin)
  if (isEmbedded || /^\/projector\/[^/]+/.test(pathname) || /^\/t\/[^/]+\/rate/.test(pathname)) {
    return null
  }

  const navItems = session?.isAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS
  const isInActiveTasting = !!activeTastingId && pathname.startsWith(`/t/${activeTastingId}`)

  return (
    <header data-app-header className="relative z-40 w-full border-b bg-background sm:sticky sm:top-0">
      <div className="container mx-auto flex min-h-14 flex-wrap items-center gap-x-1 gap-y-1 px-2 py-1 sm:gap-x-2 sm:px-4">
        <Link href="/" className="mr-1 flex shrink-0 items-center gap-2 font-bold sm:mr-3">
          <SantaMug className="h-8 w-auto" />
          <span className="hidden md:inline">Bjórsmakk</span>
        </Link>

        <nav aria-label="Aðalvalmynd" className="flex flex-wrap items-center gap-0.5 sm:gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  // Stacked icon + small label on phones, inline on larger screens
                  'inline-flex min-h-11 flex-col items-center justify-center gap-0.5 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium leading-none transition-colors [overflow-wrap:normal] sm:flex-row sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-sm',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {activeTastingId && !isInActiveTasting && (
            <Link
              href={`/t/${activeTastingId}/rate`}
              aria-label="Fara á smökkun í gangi"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-foreground opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-foreground" />
              </span>
              <span className="hidden sm:inline">Í gangi</span>
              <span>→</span>
            </Link>
          )}

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="min-h-11 whitespace-nowrap rounded-md border bg-card px-3 py-1.5 text-sm font-medium transition-colors [overflow-wrap:normal] hover:bg-accent"
              >
                Skrá inn
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <div className="flex items-center gap-2 text-sm">
              {session && <span className="hidden max-w-[8rem] truncate font-medium sm:inline">{session.name}</span>}
              {session ? (
                <AccountMenu userId={session.userId} name={session.name} onEditName={() => setEditingName(true)} />
              ) : (
                <span className="h-9 w-9 rounded-full bg-muted" aria-hidden />
              )}
            </div>
          </Show>
        </div>
      </div>

      {editingName && session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="nickname-title" className="w-full max-w-sm space-y-4 rounded-lg bg-card p-6">
            <h2 id="nickname-title" className="text-xl font-bold">Breyta gælunafni</h2>
            <NicknameForm
              initialName={session.name}
              submitLabel="Vista"
              onCancel={() => setEditingName(false)}
              onSaved={name => {
                setSession({ ...session, name })
                setEditingName(false)
              }}
            />
          </div>
        </div>
      )}
    </header>
  )
}
