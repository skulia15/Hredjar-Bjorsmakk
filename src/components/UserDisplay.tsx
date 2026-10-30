'use client'

import { SignInButton, Show, UserButton, useAuth } from '@clerk/nextjs'
import { Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function UserDisplay() {
  const pathname = usePathname()
  const { isSignedIn } = useAuth()
  const [session, setSession] = useState<{ name: string; isAdmin: boolean } | null>(null)

  useEffect(() => {
    if (!isSignedIn) return
    fetch('/api/session')
      .then(res => res.json())
      .then(data => {
        if (data.hasSession) {
          setSession({ name: data.name, isAdmin: data.isAdmin })
        }
      })
      .catch(err => console.error('Error loading user:', err))
  }, [isSignedIn])

  // Hide on projector routes and rating page
  if (pathname?.startsWith('/projector') || pathname?.match(/^\/t\/[^/]+\/rate$/)) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button
            type="button"
            className="bg-card/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border shadow-sm text-sm font-medium hover:bg-card/100 transition-colors"
          >
            Skrá inn
          </button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        {isSignedIn && session?.isAdmin && (
          <Link
            href="/admin/users"
            className="bg-card/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border shadow-sm text-sm hover:bg-card/100 transition-colors flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>Notendur</span>
          </Link>
        )}
        <div className="bg-card/95 backdrop-blur-sm pl-3 pr-1.5 py-1 rounded-lg border shadow-sm flex items-center gap-2 text-sm">
          {isSignedIn && session && <span className="font-medium">{session.name}</span>}
          <UserButton />
        </div>
      </Show>
    </div>
  )
}
