'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface LeaderboardBeer {
  beerId: string
  name: string
  brewery: string
  average: number
  count: number
  rank: number
}

interface LeaderboardWaitingProps {
  tastingId: string
  refreshInterval?: number
}

export function LeaderboardWaiting({
  tastingId,
  refreshInterval = 5000
}: LeaderboardWaitingProps) {
  const [beers, setBeers] = useState<LeaderboardBeer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
    const interval = setInterval(loadLeaderboard, refreshInterval)
    return () => clearInterval(interval)
  }, [tastingId, refreshInterval])

  const loadLeaderboard = async () => {
    try {
      const response = await fetch(`/api/tastings/${tastingId}/leaderboard`)
      if (!response.ok) throw new Error('Failed to load leaderboard')

      const data = await response.json()
      setBeers(data.beers)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMedal = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🍺</div>
          <p className="text-muted-foreground">Hleður stigatöflu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Bestu bjórarnir hingað til</h1>
          <p className="text-sm text-muted-foreground">
            Bíður eftir næsta bjór... 🍺
          </p>
        </div>

        {/* Leaderboard */}
        {beers.length > 0 ? (
          <div className="space-y-3">
            {beers.map((beer) => (
              <div
                key={beer.beerId}
                className={`bg-card p-4 rounded-lg border ${
                  beer.rank <= 3 ? 'border-primary' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getMedal(beer.rank) && (
                        <span className="text-2xl">{getMedal(beer.rank)}</span>
                      )}
                      <h3 className="font-bold text-lg">{beer.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{beer.brewery}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-primary">
                      {beer.average.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {beer.count} einkunn{beer.count !== 1 ? 'ir' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🍺</div>
            <p className="text-muted-foreground">Engir bjórar kláraðir ennþá</p>
          </div>
        )}

        {/* Link to full scores */}
        <div className="text-center">
          <Link
            href={`/t/${tastingId}/scores`}
            className="text-sm text-primary hover:underline"
          >
            Skoða allar einkunnir →
          </Link>
        </div>
      </div>
    </div>
  )
}
