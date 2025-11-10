'use client'

import { use, useState, useEffect } from 'react'
import { CurrentBeerTimer } from '@/components/CurrentBeerTimer'

interface Beer {
  id: string
  name: string
  brewery: string
  status: string
  containerSize?: number
  containerType?: string
  priceISK?: number
  averageRating?: number
  ratingCount?: number
  currentSince?: Date | string | null
}

interface Tasting {
  id: string
  title: string
  status: string
  currentTastingBeerId?: string | null
  beers: Beer[]
}

interface BeerScore {
  beerId: string
  name: string
  brewery: string
  average: number
  count: number
  rank: number
  medal: string | null
}

interface ScoresData {
  beers: BeerScore[]
}

interface RatedParticipant {
  participantId: string
  name: string
  code: string
  score: number
  submittedAt: string
}

interface PendingParticipant {
  participantId: string
  name: string
  code: string
}

interface PendingRatersData {
  currentBeerId: string
  totalParticipants: number
  ratedCount: number
  pendingCount: number
  rated: RatedParticipant[]
  pending: PendingParticipant[]
}

export default function ProjectorDisplayPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const [tasting, setTasting] = useState<Tasting | null>(null)
  const [scores, setScores] = useState<ScoresData | null>(null)
  const [pendingRaters, setPendingRaters] = useState<PendingRatersData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAllData()
    // Refresh every 5 seconds
    const interval = setInterval(loadAllData, 5000)
    return () => clearInterval(interval)
  }, [params.id])

  const loadAllData = async () => {
    try {
      // Load tasting details
      const tastingResponse = await fetch(`/api/tastings/${params.id}`)
      const tastingData = await tastingResponse.json()
      setTasting(tastingData)

      // Load scores (top beers)
      const scoresResponse = await fetch(`/api/tastings/${params.id}/scores`)
      const scoresData = await scoresResponse.json()
      setScores(scoresData)

      // Load pending raters if there's a current beer
      if (tastingData.currentTastingBeerId) {
        const pendingResponse = await fetch(`/api/tastings/${params.id}/current/pending-raters`)
        const pendingData = await pendingResponse.json()
        setPendingRaters(pendingData)
      } else {
        setPendingRaters(null)
      }
    } catch (error) {
      console.error('Error loading projector data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <div className="text-6xl mb-4">🍺</div>
          <p className="text-xl text-muted-foreground">Hleður skjávarpasýn...</p>
        </div>
      </div>
    )
  }

  if (!tasting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Smökkun fannst ekki</h2>
        </div>
      </div>
    )
  }

  const currentBeer = tasting.beers.find(b => b.id === tasting.currentTastingBeerId)
  const topBeers = scores?.beers.slice(0, 5) || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">{tasting.title}</h1>
        <div className="flex items-center justify-center gap-4 text-lg text-muted-foreground">
          <span className="px-3 py-1 bg-green-500/10 text-green-600 rounded-lg font-medium">
            {tasting.status === 'active' ? 'Í gangi' : tasting.status}
          </span>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[30%_40%_30%] gap-6 h-[calc(100vh-180px)]">
        {/* Column 1: Top 5 Beers */}
        <div className="bg-card rounded-xl border-2 border-border p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4 text-center flex items-center justify-center gap-2">
            <span>🏆</span>
            <span>Efstu 5</span>
          </h2>

          {topBeers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">🍺</div>
              <p className="text-muted-foreground">Engir bjórar klárðir ennþá</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topBeers.map((beer) => (
                <div
                  key={beer.beerId}
                  className={`p-4 rounded-lg border-2 ${
                    beer.rank <= 3
                      ? 'bg-primary/5 border-primary'
                      : 'bg-muted/50 border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {beer.medal && (
                          <span className="text-3xl">{beer.medal}</span>
                        )}
                        <span className="text-xl font-bold text-muted-foreground">
                          #{beer.rank}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg leading-tight mb-1">{beer.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {beer.brewery}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-3xl font-bold text-primary">
                        {beer.average.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {beer.count} eink.
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Current Beer */}
        <div className="bg-card rounded-xl border-2 border-border p-6 flex flex-col">
          <h2 className="text-2xl font-bold mb-4 text-center flex items-center justify-center gap-2">
            <span>🍺</span>
            <span>Núverandi bjór</span>
          </h2>

          {currentBeer ? (
            <div className="flex-1 flex flex-col justify-center space-y-6">
              <div className="bg-green-50 dark:bg-green-950/20 p-8 rounded-xl border-2 border-green-500">
                <div className="text-center space-y-4">
                  <h3 className="text-4xl md:text-5xl font-bold leading-tight">
                    {currentBeer.name}
                  </h3>
                  <p className="text-2xl md:text-3xl text-muted-foreground">
                    {currentBeer.brewery}
                  </p>

                  {(currentBeer.containerSize || currentBeer.containerType || currentBeer.priceISK) && (
                    <div className="flex items-center justify-center gap-4 text-lg flex-wrap">
                      {currentBeer.containerSize && currentBeer.containerType && (
                        <span className="text-muted-foreground">
                          {currentBeer.containerSize}ml {currentBeer.containerType}
                        </span>
                      )}
                      {currentBeer.priceISK && (
                        <span className="font-semibold text-green-600 text-xl">
                          {currentBeer.priceISK} kr
                        </span>
                      )}
                    </div>
                  )}

                  {currentBeer.currentSince && (
                    <div className="flex justify-center pt-2">
                      <div className="bg-white dark:bg-gray-900 px-6 py-3 rounded-lg">
                        <CurrentBeerTimer
                          currentSince={currentBeer.currentSince}
                          colorCoded={true}
                          size="lg"
                        />
                      </div>
                    </div>
                  )}

                  {currentBeer.ratingCount !== undefined && (
                    <p className="text-xl font-semibold text-green-600 pt-2">
                      {currentBeer.ratingCount} einkunn{currentBeer.ratingCount !== 1 ? 'ir' : ''} skráð{currentBeer.ratingCount !== 1 ? 'ar' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⏸️</div>
                <p className="text-2xl text-muted-foreground">
                  Enginn bjór valinn
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Pending Raters */}
        <div className="bg-card rounded-xl border-2 border-border p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4 text-center flex items-center justify-center gap-2">
            <span>👥</span>
            <span>Þátttakendur</span>
          </h2>

          {!currentBeer || !pendingRaters ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">⏳</div>
              <p className="text-muted-foreground">Bíður eftir bjór</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Framvinda</span>
                  <span className="text-primary">
                    {pendingRaters.ratedCount} / {pendingRaters.totalParticipants}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all duration-500"
                    style={{
                      width: pendingRaters.totalParticipants > 0
                        ? `${(pendingRaters.ratedCount / pendingRaters.totalParticipants) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
              </div>

              {/* All Done */}
              {pendingRaters.totalParticipants > 0 && pendingRaters.pendingCount === 0 && (
                <div className="text-center py-8">
                  <div className="text-6xl mb-3">🎉</div>
                  <p className="text-lg font-medium text-green-600">
                    Allir hafa gefið einkunn!
                  </p>
                </div>
              )}

              {/* Pending List */}
              {pendingRaters.pendingCount > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-orange-600 flex items-center gap-2">
                    <span>⏳</span>
                    <span>Bíður ({pendingRaters.pendingCount})</span>
                  </h3>
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {pendingRaters.pending.map((participant) => (
                      <div
                        key={participant.participantId}
                        className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-base">{participant.name}</span>
                          <span className="text-sm text-muted-foreground">({participant.code})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed List (collapsed) */}
              {pendingRaters.ratedCount > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-green-600 flex items-center gap-2">
                    <span>✓</span>
                    <span>Lokið ({pendingRaters.ratedCount})</span>
                  </h3>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {pendingRaters.rated.map((participant) => (
                      <div
                        key={participant.participantId}
                        className="p-2 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{participant.name}</span>
                          <span className="font-bold text-primary text-sm">
                            {participant.score.toFixed(1)} ⭐
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Participants */}
              {pendingRaters.totalParticipants === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Engir þátttakendur ennþá
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
