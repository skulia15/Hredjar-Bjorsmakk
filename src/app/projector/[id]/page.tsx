'use client'

import { use, useState, useEffect } from 'react'
import Image from 'next/image'
import { CurrentBeerTimer } from '@/components/CurrentBeerTimer'
import { NudgeNotification } from '@/components/NudgeNotification'

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
  imageUrl?: string | null
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
  participantRatingSpeed: Array<{
    participantId: string
    userName: string
    ratingsCount: number
    averageSeconds: number
    fastestSeconds: number
    slowestSeconds: number
    averageMinutes: number
  }>
  participantDeviation: Array<{
    participantId: string
    userName: string
    userAverage: number
    groupAverage: number
    deviation: number
    ratingsCount: number
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
    console.log('[Projector] Setting up SSE connection')
    const eventSource = new EventSource(`/api/tastings/${params.id}/stream`)

    eventSource.addEventListener('nudge', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data)
        console.log('[Projector] Nudge received:', data)

        // Show nudge notification (component will auto-hide after duration)
        setShowNudge(true)
      } catch (error) {
        console.error('[Projector] Error parsing nudge event:', error)
      }
    })

    eventSource.addEventListener('connected', () => {
      console.log('[Projector] SSE connection established')
    })

    eventSource.onerror = (err) => {
      console.error('[Projector] SSE connection error:', err)
      eventSource.close()
    }

    return () => {
      console.log('[Projector] Closing SSE connection')
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
    // Count for each whole number 1-10
    const distribution: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0
    }

    ratings.forEach(r => {
      // Round to nearest whole number
      const roundedScore = Math.round(r.score)
      if (roundedScore >= 1 && roundedScore <= 10) {
        distribution[roundedScore]++
      }
    })

    return distribution
  }

  // Helper function to calculate timing stats across all finished beers
  const getOverallTimingStats = () => {
    if (!tasting) return null

    // Get all finished beers
    const finishedBeers = tasting.beers.filter(b => b.status === 'finished' && b.currentSince)

    if (finishedBeers.length === 0) return null

    // We need to fetch ratings with timestamps, but we only have rated data from current beer
    // For now, we'll use current beer data if available, otherwise show placeholder
    // TODO: Could be improved by fetching all ratings with timestamps from API

    return null // Return null for now - need more data from API
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

    // Get fastest and slowest raters
    const fastestRater = analytics.participantRatingSpeed?.[0] || null  // First in array (sorted by averageSeconds ascending)
    const slowestRater = analytics.participantRatingSpeed?.[analytics.participantRatingSpeed.length - 1] || null  // Last in array

    // Get most deviant participant (furthest from group average)
    const mostDeviant = analytics.participantDeviation?.reduce((max, p) =>
      Math.abs(p.deviation) > Math.abs(max.deviation) ? p : max,
      analytics.participantDeviation[0]
    ) || null

    return { mostGenerous, toughestCritic, biggestSpread, fastestRater, slowestRater, mostDeviant }
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
  const topBeers = scores?.beers.slice(0, 6) || []

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
  const engagementStats = getEngagementStats()

  // Calculate overall tasting stats
  const totalBeersFinished = tasting.beers.filter(b => b.status === 'finished').length
  const totalRatingsGiven = analytics?.participantStats?.reduce((sum, p) => sum + p.ratingsCount, 0) || 0

  return (
    <div className="h-screen w-screen overflow-x-hidden overflow-y-hidden bg-gradient-to-br from-background to-muted relative flex flex-col">
      {/* Nudge Notification Overlay */}
      {showNudge && (
        <NudgeNotification
          onComplete={() => setShowNudge(false)}
          duration={3000}
        />
      )}


      {/* 3-Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 px-4 md:px-6 pb-4 md:pb-6 min-h-0 w-full">
        {/* Column 1: Top 6 Beers */}
        <div className="bg-card rounded-xl border-2 border-border p-6 overflow-y-auto min-w-0">
          <h2 className="text-2xl font-bold mb-4 text-center flex items-center justify-center gap-2">
            <span>🏆</span>
            <span>Efstu 6</span>
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
                  <div className="flex items-start gap-3">
                    {/* Beer Image */}
                    {beer.imageUrl && (
                      <div className="flex-shrink-0 h-16 w-16 flex items-center justify-center">
                        <Image
                          src={beer.imageUrl}
                          alt={beer.name}
                          width={64}
                          height={64}
                          className="rounded object-contain max-h-16"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Current Beer Stats */}
        <div className="bg-card rounded-xl border-2 border-border p-6 flex flex-col overflow-y-auto min-w-0">
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
                      width={100}
                      height={100}
                      className="rounded-lg object-contain max-h-24"
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
                  <div className="flex items-end justify-between gap-1 h-32">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => {
                      const count = scoreDistribution[score]
                      const maxCount = Math.max(...Object.values(scoreDistribution))
                      const heightPercentage = maxCount > 0 ? (count / maxCount) * 100 : 0
                      return (
                        <div key={score} className="flex-1 flex flex-col items-center gap-1">
                          {/* Bar */}
                          <div className="w-full flex flex-col justify-end items-center" style={{ height: '100px' }}>
                            <div
                              className="w-full bg-primary rounded-t transition-all duration-500 flex items-start justify-center"
                              style={{ height: `${heightPercentage}%`, minHeight: count > 0 ? '20px' : '0' }}
                            >
                              {count > 0 && (
                                <span className="text-xs font-bold text-primary-foreground pt-1">
                                  {count}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Label */}
                          <span className="text-xs font-medium">{score}</span>
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
        <div className="bg-card rounded-xl border-2 border-border p-6 flex flex-col gap-4 min-w-0">
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
                      <span>Bíður eftir {pendingRaters.pendingCount} einkunnargjöfum</span>
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
                  {/* Fastest Rater */}
                  {engagementStats?.fastestRater && (
                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800 flex flex-col items-center justify-center text-center">
                      <div className="text-4xl mb-2">🚀</div>
                      <div className="text-base text-muted-foreground mb-1">Hraðastur</div>
                      <div className="text-xl font-bold text-green-600 truncate max-w-full">
                        {engagementStats.fastestRater.userName}
                      </div>
                      <div className="text-base text-muted-foreground">
                        ⌀ {engagementStats.fastestRater.averageMinutes} mín
                      </div>
                    </div>
                  )}

                  {/* Slowest Rater */}
                  {engagementStats?.slowestRater && (
                    <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800 flex flex-col items-center justify-center text-center">
                      <div className="text-4xl mb-2">🐌</div>
                      <div className="text-base text-muted-foreground mb-1">Hægastur</div>
                      <div className="text-xl font-bold text-orange-600 truncate max-w-full">
                        {engagementStats.slowestRater.userName}
                      </div>
                      <div className="text-base text-muted-foreground">
                        ⌀ {engagementStats.slowestRater.averageMinutes} mín
                      </div>
                    </div>
                  )}

                  {/* Most Generous */}
                  {engagementStats?.mostGenerous && (
                    <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800 flex flex-col items-center justify-center text-center">
                      <div className="text-4xl mb-2">🎁</div>
                      <div className="text-base text-muted-foreground mb-1">Rausnarlegastur</div>
                      <div className="text-xl font-bold text-purple-600 truncate max-w-full">
                        {engagementStats.mostGenerous.userName}
                      </div>
                      <div className="text-lg text-muted-foreground">
                        ⌀ {engagementStats.mostGenerous.averageRating.toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Toughest Critic */}
                  {engagementStats?.toughestCritic && (
                    <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800 flex flex-col items-center justify-center text-center">
                      <div className="text-4xl mb-2">🔍</div>
                      <div className="text-base text-muted-foreground mb-1">Strangastur</div>
                      <div className="text-xl font-bold text-red-600 truncate max-w-full">
                        {engagementStats.toughestCritic.userName}
                      </div>
                      <div className="text-lg text-muted-foreground">
                        ⌀ {engagementStats.toughestCritic.averageRating.toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Most Deviant Rater */}
                  {engagementStats?.mostDeviant && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 flex flex-col items-center justify-center text-center">
                      <div className="text-4xl mb-2">🎯</div>
                      <div className="text-base text-muted-foreground mb-1">Útlaginn</div>
                      <div className="text-xl font-bold text-blue-600 truncate max-w-full">
                        {engagementStats.mostDeviant.userName}
                      </div>
                      <div className="text-base text-muted-foreground">
                        {engagementStats.mostDeviant.deviation > 0 ? '+' : ''}{engagementStats.mostDeviant.deviation.toFixed(2)} frá meðaltali
                      </div>
                    </div>
                  )}
                  {/* Total Ratings */}
                  {totalRatingsGiven > 0 && (
                    <div className="bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800 flex flex-col items-center justify-center text-center">
                      <div className="text-4xl mb-2">⭐</div>
                      <div className="text-base text-muted-foreground mb-1">Heildarfjöldi einkunna</div>
                      <div className="text-3xl font-bold text-indigo-600">
                        {totalRatingsGiven}
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
