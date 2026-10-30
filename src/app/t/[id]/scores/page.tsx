'use client'

import { use, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { NudgeNotification } from '@/components/NudgeNotification'
import { useNudge } from '@/hooks/useNudge'

const ScoresCharts = dynamic(() => import('@/components/ScoresCharts').then(mod => ({ default: mod.ScoresCharts })), {
  ssr: false,
  loading: () => (
    <div className="mt-8 text-center py-12">
      <p className="text-muted-foreground">Hleður tölfræði...</p>
    </div>
  )
})

const RatingsTable = dynamic(() => import('@/components/RatingsTable').then(mod => ({ default: mod.RatingsTable })), {
  ssr: false,
  loading: () => (
    <div className="mt-8 text-center py-12">
      <p className="text-muted-foreground">Hleður einkunnatöflu...</p>
    </div>
  )
})

const PriceAnalytics = dynamic(() => import('@/components/PriceAnalytics').then(mod => ({ default: mod.PriceAnalytics })), {
  ssr: false,
  loading: () => (
    <div className="mt-8 text-center py-12">
      <p className="text-muted-foreground">Hleður verðgreiningu...</p>
    </div>
  )
})

interface BeerScore {
  beerId: string
  name: string
  brewery: string
  average: number
  count: number
  rank: number
  containerSize?: number
  containerType?: string
}

interface ScoresData {
  tastingId: string
  title: string
  status: string
  beers: BeerScore[]
}

interface ParticipantStats {
  participantId: string
  userName: string
  code: string
  ratingsCount: number
  possibleRatings: number
  engagementRate: number
  averageRating: number
  topBeers: Array<{
    beerId: string
    name: string
    brewery: string
    score: number
  }>
  favoriteStyle: {
    style: string
    average: number
    count: number
  } | null
  ratingVariance: number
}

interface BeerTiming {
  beerId: string
  name: string
  durationMinutes: number
}

interface AnalyticsData {
  overview: {
    tastingId: string
    title: string
    status: string
    totalParticipants: number
    totalBeers: number
    finishedBeers: number
    totalRatings: number
    overallAverage: number
    averageTimePerBeer: number | null
  }
  participantStats: ParticipantStats[]
  ratingDistribution: Record<string, number>
  beerTimings: BeerTiming[]
  topRatedBeers: Array<{
    beerId: string
    name: string
    brewery: string
    average: number
    ratingsCount: number
    status: string
  }>
}

interface RatingsDetailData {
  tastingId: string
  title: string
  status: string
  participants: Array<{
    id: string
    userName: string
    code: string
  }>
  beers: Array<{
    beerId: string
    name: string
    brewery: string
    average: number
    ratingsCount: number
    ratings: Record<string, number | null>
  }>
}

export default function ScoresPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const router = useRouter()
  const [scores, setScores] = useState<ScoresData | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [ratingsDetail, setRatingsDetail] = useState<RatingsDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [showAllBeers, setShowAllBeers] = useState(false)
  const [participantId, setParticipantId] = useState('')
  const [nudgeTimestamp, setNudgeTimestamp] = useState<number | null>(null)

  useEffect(() => {
    setIsClient(true)
    loadData()
    // Refresh scores every 5 seconds during active tasting
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [params.id])

  // Get participant ID from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`participant_${params.id}`)
    if (stored) {
      const data = JSON.parse(stored)
      setParticipantId(data.participantId)
    }
  }, [params.id])

  // Show nudge when a leader nudges and this participant hasn't rated
  const handleIncomingNudge = useCallback(() => {
    setNudgeTimestamp(Date.now())
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200])
    }
  }, [])

  useNudge({
    tastingId: params.id,
    participantId,
    enabled: !!participantId,
    onNudge: handleIncomingNudge
  })

  const loadData = async () => {
    try {
      const [scoresResponse, analyticsResponse, ratingsDetailResponse] = await Promise.all([
        fetch(`/api/tastings/${params.id}/scores`),
        fetch(`/api/tastings/${params.id}/analytics`),
        fetch(`/api/tastings/${params.id}/ratings-detail`)
      ])
      const scoresData = await scoresResponse.json()
      const analyticsData = await analyticsResponse.json()
      const ratingsDetailData = await ratingsDetailResponse.json()
      setScores(scoresData)
      setAnalytics(analyticsData)
      setRatingsDetail(ratingsDetailData)
    } catch (error) {
      console.error('Error loading data:', error)
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
          <p className="text-muted-foreground">Hleður einkunnum...</p>
        </div>
      </div>
    )
  }

  if (!scores) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Einkunnir ekki tiltækar</h2>
          <Link href={`/t/${params.id}`} className="text-primary hover:underline">
            Til baka í smökkun
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
          <p className="text-muted-foreground">Stigatafla </p>
          {scores.status === 'active' && (
            <p className="text-sm text-muted-foreground">
              Uppfærslur í beinni • {scores.beers.length} bjórum gefin einkunn
            </p>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-center gap-3">
          {scores.status === 'closed' && (
            <Link
              href="/"
              className="px-6 py-3 rounded-lg border bg-card hover:bg-muted transition-colors font-medium"
            >
              Forsíða
            </Link>
          )}
          {scores.status === 'active' && (
            <Link
              href={`/t/${params.id}/rate`}
              className="px-6 py-3 rounded-lg border bg-card hover:bg-muted transition-colors font-medium"
            >
              Aftur í smökkun
            </Link>
          )}
        </div>

        {/* Scores List */}
        {scores.beers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍺</div>
            <p className="text-muted-foreground">
              Engir bjórar hafa fengið einkunn ennþá
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              {(showAllBeers ? scores.beers : scores.beers.slice(0, 3)).map((beer) => (
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
                      {(beer.containerSize || beer.containerType) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {beer.containerSize && beer.containerType && (
                            <span>{beer.containerSize}ml {beer.containerType}</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-3xl font-bold text-primary">
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

            {/* Show More/Less Button */}
            {scores.beers.length > 3 && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowAllBeers(!showAllBeers)}
                  className="px-6 py-3 rounded-lg border bg-card hover:bg-muted transition-colors font-medium"
                >
                  {showAllBeers ? (
                    <>
                      Fela stigatöflu
                      <span className="ml-2">↑</span>
                    </>
                  ) : (
                    <>
                      Sjá alla stigatöflu
                      <span className="ml-2 text-muted-foreground">({scores.beers.length - 3} bjórar í viðbót)</span>
                      <span className="ml-2">↓</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Charts and Analytics */}
        {isClient && analytics && scores.beers.length > 0 && (
          <ScoresCharts scores={scores} analytics={analytics} />
        )}

        {/* Price Analytics */}
        {isClient && scores.status === 'closed' && scores.beers.length > 0 && (
          <PriceAnalytics tastingId={params.id} />
        )}

        {/* Detailed Ratings Table */}
        {isClient && ratingsDetail && ratingsDetail.beers.length > 0 && ratingsDetail.participants.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Einkunnatafla</h2>
              <p className="text-sm text-muted-foreground">
                Einkunnir hvers þátttakanda fyrir hvern bjór
              </p>
            </div>
            <RatingsTable participants={ratingsDetail.participants} beers={ratingsDetail.beers} />
          </div>
        )}

        {/* User Statistics - Only show for closed tastings */}
        {scores.status === 'closed' && analytics && analytics.participantStats.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Ítarleg tölfræði þátttakenda</h2>
              <p className="text-sm text-muted-foreground">
                Meðaleinkunn: {analytics.overview.overallAverage.toFixed(2)} • {analytics.overview.totalRatings} einkunnir samtals
              </p>
            </div>

            <div className="space-y-3">
              {analytics.participantStats.map((participant) => (
                <div
                  key={participant.participantId}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="space-y-3">
                    {/* Participant name and average */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg">{participant.userName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {participant.ratingsCount} af {participant.possibleRatings} bjórum gefin einkunn ({participant.engagementRate}%)
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-2xl font-bold text-primary">
                          {participant.averageRating.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          meðaleinkunn
                        </div>
                      </div>
                    </div>

                    {/* Top 3 beers */}
                    {participant.topBeers && participant.topBeers.length > 0 && (
                      <div className="space-y-2">
                        <div className="font-semibold text-muted-foreground text-sm">Uppáhalds bjórar</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {participant.topBeers.map((beer, index) => (
                            <div key={beer.beerId} className="p-3 rounded bg-muted/50 relative">
                              <div className="absolute top-2 right-2 text-2xl opacity-50">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                              </div>
                              <div className="font-medium text-sm pr-8">{beer.name}</div>
                              <div className="text-xs text-muted-foreground">{beer.brewery}</div>
                              <div className="text-primary font-bold mt-1">{beer.score.toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Favorite style */}
                    {participant.favoriteStyle && (
                      <div className="p-3 rounded bg-muted/50">
                        <div className="font-semibold text-muted-foreground mb-1 text-sm">Uppáhalds stíll</div>
                        <div className="font-medium">{participant.favoriteStyle.style}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {participant.favoriteStyle.count} bjór{participant.favoriteStyle.count !== 1 ? 'ar' : ''} • Meðaleinkunn: <span className="text-primary font-semibold">{participant.favoriteStyle.average.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {/* Rating consistency */}
                    {participant.ratingVariance > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Samræmi einkunna: {participant.ratingVariance < 1.5 ? 'Mikið samræmi' : participant.ratingVariance < 2.5 ? 'Í meðallagi' : 'Misjafnt'} (σ = {participant.ratingVariance})
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-center gap-4 pt-4">
          {scores.status === 'closed' ? (
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Til baka á forsíðu
            </Link>
          ) : (
            <Link
              href={`/t/${params.id}/rate`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Til baka í smökkun
            </Link>
          )}
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Forsíða →
          </Link>
        </div>
      </div>

      {/* Nudge notification overlay */}
      {nudgeTimestamp && (
        <NudgeNotification
          key={nudgeTimestamp}
          onComplete={() => {
            console.log('[Scores] Nudge completed, clearing timestamp')
            setNudgeTimestamp(null)
          }}
          duration={3000}
        />
      )}
    </div>
  )
}
