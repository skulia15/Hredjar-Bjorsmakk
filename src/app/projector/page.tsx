'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Beer as BeerIcon, Tv, Users } from 'lucide-react'

interface Tasting {
  id: string
  title: string
  status: string
  createdAt: string
  participantCount: number
  beerCount: number
}

export default function ProjectorSelectionPage() {
  const [tastings, setTastings] = useState<Tasting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTastings()
  }, [])

  const loadTastings = async () => {
    try {
      const response = await fetch('/api/tastings')
      const data = await response.json()
      // Filter for active tastings
      const activeTastings = data.tastings.filter((t: Tasting) => t.status === 'active')
      setTastings(activeTastings)
    } catch (error) {
      console.error('Error loading tastings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BeerIcon className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Hleður smökkunum...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4 rounded-lg">
            <Image
              src="/logo.png"
              alt="Hreðjar Bjórsmakk Logo"
              width={600}
              height={450}
              className="w-full max-w-sm object-contain rounded-lg"
              priority
            />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Skjávarpasýn</h2>
          <p className="text-muted-foreground">Veldu smökkun til að sýna á skjá</p>
        </div>

        {tastings.length === 0 ? (
          <div className="bg-card p-8 rounded-lg border text-center space-y-4">
            <Tv className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Engar virkar smakkanir í gangi</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 text-center border border-input rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Til baka á forsíðu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tastings.map((tasting) => (
              <Link
                key={tasting.id}
                href={`/projector/${tasting.id}`}
                className="block w-full p-6 bg-card rounded-lg border hover:border-primary hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{tasting.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="px-2 py-1 bg-green-500/10 text-green-600 rounded">
                        {tasting.status === 'active' ? 'Í gangi' : tasting.status}
                      </span>
                      <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> {tasting.participantCount} þátttakendur</span>
                      <span className="inline-flex items-center gap-1"><BeerIcon className="h-4 w-4" /> {tasting.beerCount} bjórar</span>
                    </div>
                  </div>
                  <div className="text-3xl">→</div>
                </div>
              </Link>
            ))}

            <div className="pt-4">
              <Link
                href="/"
                className="block w-full px-4 py-3 text-center border border-input rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                ← Til baka á forsíðu
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
