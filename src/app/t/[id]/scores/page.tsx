'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'

interface BeerScore {
  beerId: string
  name: string
  brewery: string
  average: number
  count: number
  rank: number
}

interface ScoresData {
  tastingId: string
  title: string
  status: string
  beers: BeerScore[]
}

export default function ScoresPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const [scores, setScores] = useState<ScoresData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadScores()
    // Refresh scores every 5 seconds during active tasting
    const interval = setInterval(loadScores, 5000)
    return () => clearInterval(interval)
  }, [params.id])

  const loadScores = async () => {
    try {
      const response = await fetch(`/api/tastings/${params.id}/scores`)
      const data = await response.json()
      setScores(data)
    } catch (error) {
      console.error('Error loading scores:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍺</div>
          <p className="text-muted-foreground">Loading scores...</p>
        </div>
      </div>
    )
  }

  if (!scores) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Scores Not Available</h2>
          <Link href={`/t/${params.id}`} className="text-primary hover:underline">
            Return to Tasting
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">{scores.title}</h1>
          <p className="text-muted-foreground">Leaderboard</p>
          {scores.status === 'active' && (
            <p className="text-sm text-muted-foreground">
              Live updates • {scores.beers.length} beers rated
            </p>
          )}
        </div>

        {/* Scores List */}
        {scores.beers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍺</div>
            <p className="text-muted-foreground">
              No beers have been rated yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {scores.beers.map((beer) => (
              <div
                key={beer.beerId}
                className={`p-4 rounded-lg border ${
                  beer.rank <= 3
                    ? 'bg-card border-2 border-primary'
                    : 'bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getMedal(beer.rank) && (
                        <span className="text-2xl">{getMedal(beer.rank)}</span>
                      )}
                      <span className="text-lg font-semibold text-muted-foreground">
                        #{beer.rank}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg truncate">{beer.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {beer.brewery}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-3xl font-bold text-primary">
                      {beer.average.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {beer.count} rating{beer.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-center gap-4 pt-4">
          <Link
            href={`/t/${params.id}/rate`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Rating
          </Link>
        </div>
      </div>
    </div>
  )
}
