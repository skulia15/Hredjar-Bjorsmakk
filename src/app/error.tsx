'use client'

import { useEffect } from 'react'
import Link from 'next/link'

// Catches a render error in any page below the root layout, so one bad response shows this
// with a way back instead of a blank screen mid-tasting
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <h2 className="text-2xl font-bold">Eitthvað fór úrskeiðis</h2>
        <p className="text-muted-foreground">Prófaðu aftur. Einkunnirnar þínar eru öruggar.</p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Reyna aftur
          </button>
          <Link href="/" className="px-4 py-2 rounded-md border font-medium hover:bg-muted transition-colors">
            Forsíða
          </Link>
        </div>
      </div>
    </div>
  )
}
