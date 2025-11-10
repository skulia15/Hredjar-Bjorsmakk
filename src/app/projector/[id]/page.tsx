'use client'

import { use, useState, useEffect } from 'react'
import Image from 'next/image'
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
  imageUrl?: string | null
}

interface Tasting {
  id: string
  title: string
  status: string
  currentBeerId?: string | null
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

interface AnalyticsData {
  participantStats: Array<{
    participantId: string
    userName: string
    averageRating: number
    ratingsCount: number
  }>
  participantRatingSpread: Array<{
    participantId: string
    userName: string
    range: number
    standardDeviation: number
  }>
}

export default function ProjectorDisplayPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const [tasting, setTasting] = useState<Tasting | null>(null)
  const [scores, setScores] = useState<ScoresData | null>(null)
  const [pendingRaters, setPendingRaters] = useState<PendingRatersData | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNudge, setShowNudge] = useState(false)

  useEffect(() => {
    loadAllData()
    // Refresh every 5 seconds
    const interval = setInterval(loadAllData, 5000)
    return () => clearInterval(interval)
  }, [params.id])

  // Setup SSE connection for nudge notifications
  useEffect(() => {
    const eventSource = new EventSource(`/api/tastings/${params.id}/stream`)

    eventSource.addEventListener('nudge', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data)
        console.log('[Projector] Nudge received:', data)

        // Show nudge notification
        setShowNudge(true)

        // Hide after 3 seconds
        setTimeout(() => {
          setShowNudge(false)
        }, 3000)
      } catch (error) {
        console.error('[Projector] Error parsing nudge event:', error)
      }
    })

    eventSource.onerror = (err) => {
      console.error('[Projector] SSE connection error:', err)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
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

      // Load analytics
      const analyticsResponse = await fetch(`/api/tastings/${params.id}/analytics`)
      const analyticsData = await analyticsResponse.json()
      setAnalytics(analyticsData)

      // Load pending raters if there's a current beer
      if (tastingData.currentBeerId) {
        try {
          const pendingResponse = await fetch(`/api/tastings/${params.id}/current/pending-raters`)
          if (pendingResponse.ok) {
            const pendingData = await pendingResponse.json()
            setPendingRaters(pendingData)
          } else {
            console.error('Failed to load pending raters:', await pendingResponse.text())
            setPendingRaters(null)
          }
        } catch (err) {
          console.error('Error fetching pending raters:', err)
          setPendingRaters(null)
        }
      } else {
        setPendingRaters(null)
      }
    } catch (error) {
      console.error('Error loading projector data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to calculate score distribution
  const getScoreDistribution = (ratings: RatedParticipant[]) => {
    const distribution: Record<number, number> = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    }

    ratings.forEach(r => {
      const roundedScore = Math.round(r.score)
      if (roundedScore >= 1 && roundedScore <= 5) {
        distribution[roundedScore]++
      }
    })

    return distribution
  }

  // Helper function to calculate timing stats
  const getTimingStats = (ratings: RatedParticipant[], currentSince?: Date | string | null) => {
    if (!currentSince || ratings.length === 0) return null

    const startTime = new Date(currentSince).getTime()
    const times = ratings.map(r => {
      const submitTime = new Date(r.submittedAt).getTime()
      return {
        name: r.name,
        seconds: Math.max(0, (submitTime - startTime) / 1000)
      }
    })

    const avgSeconds = times.reduce((sum, t) => sum + t.seconds, 0) / times.length
    const fastest = times.reduce((min, t) => t.seconds < min.seconds ? t : min, times[0])
    const slowest = times.reduce((max, t) => t.seconds > max.seconds ? t : max, times[0])

    return { avgSeconds, fastest, slowest }
  }

  // Helper function to get engagement stats
  const getEngagementStats = () => {
    if (!analytics?.participantStats || analytics.participantStats.length === 0) return null

    const statsWithRatings = analytics.participantStats.filter(p => p.ratingsCount > 0)
    if (statsWithRatings.length === 0) return null

    const mostGenerous = statsWithRatings.reduce((max, p) =>
      p.averageRating > max.averageRating ? p : max, statsWithRatings[0])
    const toughestCritic = statsWithRatings.reduce((min, p) =>
      p.averageRating < min.averageRating ? p : min, statsWithRatings[0])

    const biggestSpread = analytics.participantRatingSpread?.[0] || null

    return { mostGenerous, toughestCritic, biggestSpread }
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

  const currentBeer = tasting.beers.find(b => b.id === tasting.currentBeerId)
  const topBeers = scores?.beers.slice(0, 5) || []

  // Calculate current beer stats
  const currentBeerRatings = pendingRaters?.rated || []
  const scoreDistribution = currentBeerRatings.length > 0 ? getScoreDistribution(currentBeerRatings) : null
  const liveAverage = currentBeerRatings.length > 0
    ? currentBeerRatings.reduce((sum, r) => sum + r.score, 0) / currentBeerRatings.length
    : null
  const highestScore = currentBeerRatings.length > 0
    ? Math.max(...currentBeerRatings.map(r => r.score))
    : null
  const lowestScore = currentBeerRatings.length > 0
    ? Math.min(...currentBeerRatings.map(r => r.score))
    : null
  const timingStats = currentBeer && currentBeerRatings.length > 0
    ? getTimingStats(currentBeerRatings, currentBeer.currentSince)
    : null
  const engagementStats = getEngagementStats()

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-background to-muted relative flex flex-col">
      {/* Nudge Notification Overlay */}
      {showNudge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-300">
          <div className="bg-red-600 text-white px-12 py-8 rounded-2xl shadow-2xl animate-in zoom-in duration-300">
            <div className="text-center space-y-4">
              <div className="text-8xl">⏰</div>
              <div className="text-4xl font-bold">Drífa sig!</div>
              <div className="text-2xl">Komið með einkunn!</div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 py-4 px-4 md:px-6 text-center">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">{tasting.title}</h1>
        <div className="flex items-center justify-center gap-4 text-base md:text-lg text-muted-foreground">
          <span className="px-3 py-1 bg-green-500/10 text-green-600 rounded-lg font-medium">
            {tasting.status === 'active' ? 'Í gangi' : tasting.status}
          </span>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[30%_40%_30%] gap-4 md:gap-6 px-4 md:px-6 pb-4 md:pb-6 min-h-0">
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

        {/* Column 2: Current Beer Stats */}
        <div className="bg-card rounded-xl border-2 border-border p-6 flex flex-col overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4 text-center flex items-center justify-center gap-2">
            <span>🍺</span>
            <span>Núverandi bjór</span>
          </h2>

          {currentBeer ? (
            <div className="flex-1 space-y-4">
              {/* Beer Image & Name */}
              <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-xl border-2 border-green-500">
                {currentBeer.imageUrl && (
                  <div className="flex justify-center mb-3">
                    <Image
                      src={currentBeer.imageUrl}
                      alt={currentBeer.name}
                      width={120}
                      height={120}
                      className="rounded-lg object-contain"
                    />
                  </div>
                )}
                <h3 className="text-2xl md:text-3xl font-bold text-center leading-tight">
                  {currentBeer.name}
                </h3>
                <p className="text-lg md:text-xl text-muted-foreground text-center">
                  {currentBeer.brewery}
                </p>
              </div>

              {/* Live Average Score */}
              {liveAverage !== null ? (
                <div className="bg-primary/10 p-6 rounded-lg border-2 border-primary text-center">
                  <div className="text-sm text-muted-foreground mb-1">Meðaleinkunn</div>
                  <div className="text-5xl font-bold text-primary">
                    {liveAverage.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {currentBeerRatings.length} einkunn{currentBeerRatings.length !== 1 ? 'ir' : ''}
                  </div>
                </div>
              ) : (
                <div className="bg-muted/50 p-6 rounded-lg text-center">
                  <div className="text-muted-foreground">Engar einkunnir ennþá</div>
                </div>
              )}

              {/* Score Distribution */}
              {scoreDistribution && (
                <div className="bg-card p-4 rounded-lg border">
                  <div className="text-sm font-medium mb-3 text-center">Einkunnir</div>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(score => {
                      const count = scoreDistribution[score]
                      const percentage = currentBeerRatings.length > 0
                        ? (count / currentBeerRatings.length) * 100
                        : 0
                      return (
                        <div key={score} className="flex items-center gap-2">
                          <span className="text-sm w-8">{score}⭐</span>
                          <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all duration-500 flex items-center justify-end px-2"
                              style={{ width: `${percentage}%` }}
                            >
                              {count > 0 && (
                                <span className="text-xs font-medium text-primary-foreground">
                                  {count}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* High/Low Scores */}
              {highestScore !== null && lowestScore !== null && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800 text-center">
                    <div className="text-xs text-muted-foreground">Hæsta</div>
                    <div className="text-2xl font-bold text-green-600">{highestScore.toFixed(1)}</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800 text-center">
                    <div className="text-xs text-muted-foreground">Lægsta</div>
                    <div className="text-2xl font-bold text-orange-600">{lowestScore.toFixed(1)}</div>
                  </div>
                </div>
              )}

              {/* Timer */}
              {currentBeer.currentSince && (
                <div className="bg-card p-3 rounded-lg border text-center">
                  <div className="text-xs text-muted-foreground mb-1">Tími</div>
                  <CurrentBeerTimer
                    currentSince={currentBeer.currentSince}
                    colorCoded={true}
                    size="lg"
                  />
                </div>
              )}
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

        {/* Column 3: Participation & Stats */}
        <div className="bg-card rounded-xl border-2 border-border p-6 flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <span>👥</span>
            <span>Þátttaka</span>
          </h2>

          {!currentBeer || !pendingRaters ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-12">
                <div className="text-5xl mb-3">⏳</div>
                <p className="text-muted-foreground">Bíður eftir bjór</p>
              </div>
            </div>
          ) : (
            <>
              {/* Top Section: Pending Raters (~60% height) */}
              <div className="flex-[3] flex flex-col space-y-3 overflow-hidden">
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
                {pendingRaters.totalParticipants > 0 && pendingRaters.pendingCount === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center py-8">
                      <div className="text-6xl mb-3">🎉</div>
                      <p className="text-lg font-medium text-green-600">
                        Allir hafa gefið einkunn!
                      </p>
                    </div>
                  </div>
                ) : pendingRaters.pendingCount > 0 ? (
                  /* Pending List */
                  <div className="flex-1 flex flex-col min-h-0">
                    <h3 className="text-lg font-semibold text-orange-600 flex items-center gap-2 mb-2">
                      <span>⏳</span>
                      <span>Bíður ({pendingRaters.pendingCount})</span>
                    </h3>
                    <div className="flex-1 space-y-1 overflow-y-auto">
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
                ) : null}
              </div>

              {/* Bottom Section: Stats (~40% height) */}
              <div className="flex-[2] flex flex-col border-t-2 pt-4">
                <h3 className="text-lg font-semibold mb-3 text-center">📊 Tölfræði</h3>
                <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto">
                  {/* Average Time */}
                  {timingStats && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-2 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-xs text-muted-foreground">Meðal tími</div>
                      <div className="text-lg font-bold text-blue-600">
                        {Math.floor(timingStats.avgSeconds / 60)}:{String(Math.floor(timingStats.avgSeconds % 60)).padStart(2, '0')}
                      </div>
                    </div>
                  )}

                  {/* Fastest */}
                  {timingStats && timingStats.fastest && (
                    <div className="bg-green-50 dark:bg-green-950/20 p-2 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="text-xs text-muted-foreground">Hraðastur</div>
                      <div className="text-sm font-bold text-green-600 truncate">
                        {timingStats.fastest.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.floor(timingStats.fastest.seconds / 60)}:{String(Math.floor(timingStats.fastest.seconds % 60)).padStart(2, '0')}
                      </div>
                    </div>
                  )}

                  {/* Slowest */}
                  {timingStats && timingStats.slowest && (
                    <div className="bg-orange-50 dark:bg-orange-950/20 p-2 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="text-xs text-muted-foreground">Hægastur</div>
                      <div className="text-sm font-bold text-orange-600 truncate">
                        {timingStats.slowest.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.floor(timingStats.slowest.seconds / 60)}:{String(Math.floor(timingStats.slowest.seconds % 60)).padStart(2, '0')}
                      </div>
                    </div>
                  )}

                  {/* Most Generous */}
                  {engagementStats?.mostGenerous && (
                    <div className="bg-purple-50 dark:bg-purple-950/20 p-2 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="text-xs text-muted-foreground">Rausnarlegastur</div>
                      <div className="text-sm font-bold text-purple-600 truncate">
                        {engagementStats.mostGenerous.userName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ⌀ {engagementStats.mostGenerous.averageRating.toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Toughest Critic */}
                  {engagementStats?.toughestCritic && (
                    <div className="bg-red-50 dark:bg-red-950/20 p-2 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="text-xs text-muted-foreground">Strangastur</div>
                      <div className="text-sm font-bold text-red-600 truncate">
                        {engagementStats.toughestCritic.userName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ⌀ {engagementStats.toughestCritic.averageRating.toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Biggest Spread */}
                  {engagementStats?.biggestSpread && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="text-xs text-muted-foreground">Mest dreifing</div>
                      <div className="text-sm font-bold text-yellow-600 truncate">
                        {engagementStats.biggestSpread.userName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        σ {engagementStats.biggestSpread.standardDeviation.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
