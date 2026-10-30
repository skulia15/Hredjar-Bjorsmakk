'use client'

import { useAuth } from '@clerk/nextjs'
import { useQuery } from '@tanstack/react-query'
import { Settings, Star, Trophy } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type TastingSummary = {
  status: 'draft' | 'active' | 'closed'
  currentUserIsLeader: boolean
}

export function TastingTabs({ tastingId }: { tastingId: string }) {
  const pathname = usePathname() ?? ''
  const { isSignedIn } = useAuth()
  const [isEmbedded, setIsEmbedded] = useState(false)

  useEffect(() => {
    setIsEmbedded(window.self !== window.top)
  }, [])

  const base = `/t/${tastingId}`
  // Join page (/t/[id]) is a standalone sign-in/join step, not one of the tasting views
  const isJoinPage = pathname === base

  const { data: tasting } = useQuery<TastingSummary>({
    // Leader status depends on who is signed in
    queryKey: ['tasting-summary', tastingId, isSignedIn],
    queryFn: async () => {
      const res = await fetch(`/api/tastings/${tastingId}`)
      if (!res.ok) throw new Error('Failed to load tasting')
      return res.json()
    },
    enabled: !isJoinPage,
  })

  if (isEmbedded || isJoinPage || !tasting) return null

  const tabs = [
    tasting.status !== 'closed' && { href: `${base}/rate`, label: 'Smakka', icon: Star },
    { href: `${base}/scores`, label: 'Stigatafla', icon: Trophy },
    tasting.currentUserIsLeader && { href: `${base}/admin`, label: 'Stjórnun', icon: Settings },
  ].filter((tab): tab is { href: string; label: string; icon: typeof Star } => !!tab)

  if (tabs.length < 2) return null

  return (
    <div className="border-b bg-background/60">
      <div className="container mx-auto px-4">
        <nav aria-label="Smökkun" className="-mb-px flex flex-1 gap-1 overflow-x-auto sm:flex-none">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors sm:flex-none',
                  active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
