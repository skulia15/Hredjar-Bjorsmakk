'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

/**
 * Global navigation button that appears when user has an active tasting
 * Does NOT show on the main tasting rating page
 */
export function ReturnToTastingButton() {
  const pathname = usePathname()
  const router = useRouter()
  const [activeTastingId, setActiveTastingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for active tasting
    const stored = localStorage.getItem('activeTastingId')
    if (stored) {
      setActiveTastingId(stored)
    }
    setIsLoading(false)
  }, [])

  // Don't show if:
  // 1. Still loading
  // 2. No active tasting
  // 3. Already on the main tasting rating page
  if (isLoading || !activeTastingId) {
    return null
  }

  // Check if we're on the main tasting rating page
  const isOnTastingRatePage = pathname === `/t/${activeTastingId}/rate`
  const isOnTastingAdminPage = pathname?.startsWith(`/t/${activeTastingId}/admin`)

  // Don't show if we're already on the tasting page
  if (isOnTastingRatePage || isOnTastingAdminPage) {
    return null
  }

  return (
    <Link
      href={`/t/${activeTastingId}/rate`}
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 px-6 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-105 flex items-center gap-2 font-medium"
    >
      <span className="text-xl">🍺</span>
      <span className="hidden sm:inline">Return to Tasting</span>
      <span className="sm:hidden">Tasting</span>
      <span>→</span>
    </Link>
  )
}

/**
 * Helper hook to set/clear active tasting
 */
export function useActiveTasting() {
  const setActiveTasting = (tastingId: string) => {
    localStorage.setItem('activeTastingId', tastingId)
    // Trigger storage event for other components
    window.dispatchEvent(new Event('storage'))
  }

  const clearActiveTasting = () => {
    localStorage.removeItem('activeTastingId')
    window.dispatchEvent(new Event('storage'))
  }

  return { setActiveTasting, clearActiveTasting }
}
