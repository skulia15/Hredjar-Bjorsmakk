'use client'

import { use, useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { CurrentBeerTimer } from '@/components/CurrentBeerTimer'
import { NudgeNotification } from '@/components/NudgeNotification'
import { useNudge } from '@/hooks/useNudge'
import { useProjectorControls } from '@/hooks/useProjectorControls'
import { AwardsReveal } from '@/components/AwardsReveal'
import { buildAwards, closestGuess, extremeRaters, type GuessAccuracy, type Rater, type TastePair, type ValuePick } from '@/lib/stats'
import { playFanfare, playPop } from '@/lib/sounds'
import { BarChart3, Beer as BeerIcon, Brain, EyeOff, Gift, Hourglass, Maximize, Medal, Minimize, PartyPopper, Rocket, Search, Snail, Sparkles, Star, Target, Trophy, Volume2, VolumeX } from 'lucide-react'
import { JoinQrCode } from '@/components/JoinQrCode'
import type { BeerTagCount } from '@/components/TastingNotes'
import { AnimatedLeaderboard } from '@/components/projector/AnimatedLeaderboard'
import { BeerFinishedReveal, type FinishedBeerReveal } from '@/components/projector/BeerFinishedReveal'
import { CountUp } from '@/components/projector/CountUp'
import { LobbyParticipants, type LobbyParticipant } from '@/components/projector/LobbyParticipants'
import { ProgressStrip } from '@/components/projector/ProgressStrip'
import { ScoreBars } from '@/components/projector/ScoreBars'
import { TagCloud } from '@/components/projector/TagCloud'

interface Beer {
  id: string
  name: string
  brewery: string
  status: string
  containerSize?: number
  containerType?: string
  priceISK?: number
  averageRating?: number | null
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
  participants: LobbyParticipant[]
}

interface BeerScore {
  beerId: string
  name: string
  brewery: string
  average: number
  count: number
  rank: number
  imageUrl?: string | null
}

interface ScoresData {
  beers: BeerScore[]
}

interface RatedParticipant {
  participantId: string
  name: string
  code: string
  score: number | null  // null while the tasting hides scores until everyone has rated
  groupGuess: number | null
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
  scoresHidden: boolean
  tags: BeerTagCount[]
  rated: RatedParticipant[]
  pending: PendingParticipant[]
}

interface RatingsDetailData {
  participants: Array<{ id: string; userName: string }>
  beers: Array<{
    beerId: string
    ratings: Record<string, number | null>
    tags: BeerTagCount[]
    guesses: Array<{ participantId: string; userName: string; guess: number }>
  }>
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
  beerControversy?: Array<{
    beerId: string
    name: string
    standardDeviation: number
    highestRater?: Rater
    lowestRater?: Rater
  }>
  tasteTwins?: { closest: TastePair; furthest: TastePair } | null
  guessAccuracy?: GuessAccuracy[]
  bestValue?: ValuePick | null
}

/** Everything the finished-beer reveal shows, from the fresh scores plus the beer's ratings */
async function loadFinishedReveal(tastingId: string, beer: Beer, scores: ScoresData): Promise<FinishedBeerReveal | null> {
  const score = scores.beers.find(b => b.beerId === beer.id)
  if (!score) return null // Nobody rated it, nothing to reveal

  const response = await fetch(`/api/tastings/${tastingId}/ratings-detail`)
  const detail: RatingsDetailData | null = response.ok ? await response.json() : null
  const beerDetail = detail?.beers.find(b => b.beerId === beer.id)
  const raters = detail && beerDetail
    ? detail.participants.flatMap(p => {
        const value = beerDetail.ratings[p.id]
        return value == null ? [] : [{ userName: p.userName, score: value }]
      })
    : []
  const guess = closestGuess(beerDetail?.guesses ?? [], score.average)

  return {
    beerId: beer.id,
    name: beer.name,
    brewery: beer.brewery,
    imageUrl: beer.imageUrl,
    average: score.average,
    count: score.count,
    rank: score.rank,
    totalRanked: scores.beers.length,
    ...extremeRaters(raters),
    closestGuess: guess ?? undefined,
    tags: beerDetail?.tags ?? [],
  }
}

export default function ProjectorDisplayPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const [tasting, setTasting] = useState<Tasting | null>(null)
  const [scores, setScores] = useState<ScoresData | null>(null)
  const [pendingRaters, setPendingRaters] = useState<PendingRatersData | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNudge, setShowNudge] = useState(false)
  const [awardsDismissed, setAwardsDismissed] = useState(false)
  const [finishedReveal, setFinishedReveal] = useState<FinishedBeerReveal | null>(null)
  // The current beer whose hidden scores were just revealed, for the reveal animation
  const [revealedBeerId, setRevealedBeerId] = useState<string | null>(null)
  const closeAwards = useCallback(() => setAwardsDismissed(true), [])
  const closeFinishedReveal = useCallback(() => setFinishedReveal(null), [])
  const { isFullscreen, toggleFullscreen, soundOn, toggleSound } = useProjectorControls()

  // What the previous poll saw, to spot transitions; undefined until the first load
  const previous = useRef<{
    currentBeerId: string | null
    hiddenBeerId: string | null
    participantIds: Set<string>
  } | undefined>(undefined)

  useEffect(() => {
    loadAllData()
    // Refresh every 5 seconds
    const interval = setInterval(loadAllData, 5000)
    return () => clearInterval(interval)
  }, [params.id])

  // Projector shows every nudge (component will auto-hide after duration)
  const handleIncomingNudge = useCallback(() => setShowNudge(true), [])

  useNudge({ tastingId: params.id, participantId: null, onNudge: handleIncomingNudge })

  const loadAllData = async () => {
    try {
      // Load tasting details
      const tastingResponse = await fetch(`/api/tastings/${params.id}`)
      const tastingData: Tasting = await tastingResponse.json()
      setTasting(tastingData)

      // Load scores (top beers)
      const scoresResponse = await fetch(`/api/tastings/${params.id}/scores`)
      const scoresData: ScoresData = await scoresResponse.json()
      setScores(scoresData)

      // Load analytics
      const analyticsResponse = await fetch(`/api/tastings/${params.id}/analytics`)
      const analyticsData = await analyticsResponse.json()
      setAnalytics(analyticsData)

      // Load pending raters if there's a current beer
      let pendingData: PendingRatersData | null = null
      if (tastingData.currentBeerId) {
        try {
          const pendingResponse = await fetch(`/api/tastings/${params.id}/current/pending-raters`)
          if (pendingResponse.ok) {
            pendingData = await pendingResponse.json()
          } else {
            console.error('Failed to load pending raters:', await pendingResponse.text())
          }
        } catch (err) {
          console.error('Error fetching pending raters:', err)
        }
      }
      setPendingRaters(pendingData)

      const before = previous.current
      const hiddenBeerId = pendingData?.scoresHidden ? pendingData.currentBeerId : null
      previous.current = {
        currentBeerId: tastingData.currentBeerId ?? null,
        hiddenBeerId,
        participantIds: new Set(tastingData.participants.map(p => p.id)),
      }
      if (!before) return

      // The beer on screen was just finished
      const finishedBeer = before.currentBeerId && before.currentBeerId !== tastingData.currentBeerId
        ? tastingData.beers.find(b => b.id === before.currentBeerId && b.status === 'finished')
        : undefined
      if (finishedBeer) {
        loadFinishedReveal(params.id, finishedBeer, scoresData)
          .then(reveal => reveal && setFinishedReveal(reveal))
          .catch(err => console.error('Error loading finished beer reveal:', err))
      }

      // The last person rated, so the hidden scores just came out
      if (before.hiddenBeerId && before.hiddenBeerId === pendingData?.currentBeerId && !hiddenBeerId) {
        setRevealedBeerId(before.hiddenBeerId)
        playFanfare()
      }

      if (tastingData.participants.some(p => !before.participantIds.has(p.id))) playPop()
    } catch (error) {
      console.error('Error loading projector data:', error)
    } finally {
      setLoading(false)
    }
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
          <BeerIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
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
  const awards = tasting.status === 'closed' && analytics
    ? buildAwards({
        participantStats: analytics.participantStats,
        beerControversy: analytics.beerControversy ?? [],
        winner: scores?.beers[0],
        tasteTwins: analytics.tasteTwins,
        guessAccuracy: analytics.guessAccuracy,
        bestValue: analytics.bestValue,
        ratingSpeed: analytics.participantRatingSpeed,
      })
    : []
  const showingAwards = awards.length > 0 && !awardsDismissed

  // Calculate current beer stats
  const currentBeerRatings = (pendingRaters?.rated || [])
    .filter((r): r is RatedParticipant & { score: number } => r.score !== null)
  const liveAverage = currentBeerRatings.length > 0
    ? currentBeerRatings.reduce((sum, r) => sum + r.score, 0) / currentBeerRatings.length
    : null
  const highestScore = currentBeerRatings.length > 0
    ? Math.max(...currentBeerRatings.map(r => r.score))
    : null
  const lowestScore = currentBeerRatings.length > 0
    ? Math.min(...currentBeerRatings.map(r => r.score))
    : null

  // Just revealed: celebrate and name whoever guessed the group average best
  const justRevealed = !!currentBeer && revealedBeerId === currentBeer.id
  const bestGuess = justRevealed && liveAverage !== null
    ? closestGuess(
        currentBeerRatings.flatMap(r => (r.groupGuess === null ? [] : [{ userName: r.name, guess: r.groupGuess }])),
        liveAverage
      )
    : null

  const engagementStats = getEngagementStats()

  // Calculate overall tasting stats
  const totalRatingsGiven = analytics?.participantStats?.reduce((sum, p) => sum + p.ratingsCount, 0) || 0

  return (
    <div className="h-screen w-screen overflow-x-hidden overflow-y-hidden bg-gradient-to-br from-background to-muted relative flex flex-col">
      {/* Awards reveal once the tasting is closed */}
      {showingAwards && (
        <AwardsReveal awards={awards} winnerName={scores?.beers[0]?.name} onClose={closeAwards} />
      )}
      {awards.length > 0 && awardsDismissed && (
        <button
          onClick={() => setAwardsDismissed(false)}
          className="fixed bottom-4 right-4 z-40 px-4 py-2 rounded-lg border bg-card hover:bg-muted font-medium shadow"
        >
          <Medal className="inline h-4 w-4 mr-1 -mt-0.5 text-yellow-500" />Sýna verðlaun
        </button>
      )}

      {/* Beer finished: drumroll, score and where it landed */}
      {finishedReveal && !showingAwards && (
        <BeerFinishedReveal key={finishedReveal.beerId} reveal={finishedReveal} onClose={closeFinishedReveal} />
      )}

      {/* Nudge Notification Overlay */}
      {showNudge && (
        <NudgeNotification
          onComplete={() => setShowNudge(false)}
          duration={3000}
        />
      )}

      {/* Progress through the tasting, with screen controls */}
      <div className="flex items-center">
        <div className="flex-1 min-w-0">
          <ProgressStrip beers={tasting.beers} currentBeerId={tasting.currentBeerId} />
        </div>
        <div className="flex gap-1 pr-4 md:pr-6 opacity-40 hover:opacity-100 transition-opacity">
          <button
            onClick={toggleSound}
            className="p-2 rounded-md hover:bg-muted"
            aria-label={soundOn ? 'Slökkva á hljóði' : 'Kveikja á hljóði'}
            title={soundOn ? 'Slökkva á hljóði' : 'Kveikja á hljóði'}
          >
            {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-md hover:bg-muted"
            aria-label={isFullscreen ? 'Hætta í fullum skjá' : 'Fullur skjár'}
            title={isFullscreen ? 'Hætta í fullum skjá' : 'Fullur skjár'}
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 px-4 md:px-6 pb-4 md:pb-6 min-h-0 w-full">
        {/* Column 1: Top 6 Beers */}
        <div className="bg-card rounded-xl border-2 border-border p-6 flex flex-col min-h-0 min-w-0">
          <div className="flex-1 min-h-0 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4 text-center flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span>Efstu 6</span>
          </h2>

          {!scores || scores.beers.length === 0 ? (
            <div className="text-center py-12">
              <BeerIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Engir bjórar klárðir ennþá</p>
            </div>
          ) : (
            <AnimatedLeaderboard beers={scores.beers} limit={6} />
          )}
          </div>

          {/* Latecomers can still join while a beer is on screen; in flow so it never covers the list */}
          {currentBeer && tasting.status !== 'closed' && (
            <div className="pt-4 mt-4 border-t flex items-center gap-4 shrink-0">
              <JoinQrCode tastingId={tasting.id} size={96} />
              <p className="text-lg font-semibold leading-tight">Skannaðu til<br />að taka þátt</p>
            </div>
          )}
        </div>

        {/* Column 2: Current Beer Stats */}
        <div className="bg-card rounded-xl border-2 border-border p-6 flex flex-col overflow-y-auto min-w-0">
          <h2 className="text-2xl font-bold mb-4 text-center flex items-center justify-center gap-2">
            <BeerIcon className="h-6 w-6 text-amber-500" />
            <span>Núverandi bjór</span>
          </h2>

          {currentBeer ? (
            <div className="flex-1 space-y-4">
              {/* Beer Image & Name */}
              <div key={currentBeer.id} className="bg-green-50 dark:bg-green-950/20 p-4 rounded-xl border-2 border-green-500 animate-in fade-in zoom-in-95 duration-500">
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
                {currentBeer.currentSince && (
                  <div className="flex justify-center mt-2">
                    <CurrentBeerTimer currentSince={currentBeer.currentSince} colorCoded={false} size="sm" />
                  </div>
                )}
              </div>

              {/* Live Average Score */}
              {pendingRaters?.scoresHidden ? (
                <div className="bg-muted/50 p-6 rounded-lg text-center">
                  <EyeOff className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-muted-foreground">Einkunnir birtast þegar allir hafa gefið einkunn</div>
                  <div className="text-3xl font-bold mt-2 tabular-nums">
                    {pendingRaters.ratedCount} / {pendingRaters.totalParticipants}
                  </div>
                </div>
              ) : liveAverage !== null ? (
                <div
                  // Remount on reveal so the average counts up from zero
                  key={`average-${currentBeer.id}-${justRevealed ? 'revealed' : 'live'}`}
                  className={`p-6 rounded-lg border-2 text-center ${
                    justRevealed ? 'bg-yellow-400/15 border-yellow-400 animate-in zoom-in-90 duration-700' : 'bg-primary/10 border-primary'
                  }`}
                >
                  {justRevealed && (
                    <div className="flex items-center justify-center gap-2 text-lg font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                      <Sparkles className="h-5 w-5" /> Einkunnir birtar!
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground mb-1">Meðaleinkunn</div>
                  <div className="text-5xl font-bold text-primary">
                    <CountUp value={liveAverage} durationMs={justRevealed ? 1800 : 600} />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {currentBeerRatings.length} einkunn{currentBeerRatings.length !== 1 ? 'ir' : ''}
                  </div>
                  {bestGuess && (
                    <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-violet-600 animate-in fade-in fill-mode-both duration-700 [animation-delay:1800ms]">
                      <Brain className="h-4 w-4" />
                      {bestGuess.userName} giskaði næst: {bestGuess.guess.toFixed(1)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-muted/50 p-6 rounded-lg text-center">
                  <div className="text-muted-foreground">Engar einkunnir ennþá</div>
                </div>
              )}

              {/* Score Distribution; remounts on reveal so the bars grow in */}
              {currentBeerRatings.length > 0 && (
                <ScoreBars key={`bars-${currentBeer.id}-${justRevealed ? 'revealed' : 'live'}`} scores={currentBeerRatings.map(r => r.score)} />
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

              {/* Flavor tags; shown even while scores are hidden, they don't give the score away */}
              {pendingRaters && pendingRaters.tags.length > 0 && (
                <div className="bg-card p-4 rounded-lg border">
                  <div className="text-sm font-medium mb-2 text-center">Bragðlýsingar</div>
                  <TagCloud tags={pendingRaters.tags} />
                </div>
              )}
            </div>
          ) : tasting.status !== 'closed' ? (
            // Between beers (and before the start) the screen is a lobby: big scan-to-join code
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-6">
                <p className="text-3xl font-bold">Skannaðu til að taka þátt</p>
                <JoinQrCode tastingId={tasting.id} size={240} showUrl />
                <LobbyParticipants participants={tasting.participants} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                <p className="text-2xl text-muted-foreground">
                  Smökkun lokið
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Stats & Participation */}
        <div className="bg-card rounded-xl border-2 border-border p-6 flex flex-col gap-4 min-w-0">
          {/* Top Section: tasting-wide stats, kept up between beers */}
          {engagementStats && (
            <div className="flex flex-col flex-shrink-0">
              <h3 className="text-lg font-semibold mb-3 text-center"><BarChart3 className="inline h-5 w-5 mr-1 -mt-0.5" /> Tölfræði</h3>
              <div className="grid grid-cols-2 gap-2">
                {/* Fastest Rater */}
                {engagementStats.fastestRater && (
                  <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800 flex flex-col items-center justify-center text-center">
                    <Rocket className="h-10 w-10 mx-auto mb-2 text-green-600" />
                    <div className="text-sm text-muted-foreground mb-1">Hraðastur</div>
                    <div className="text-lg font-bold text-green-600 truncate max-w-full">
                      {engagementStats.fastestRater.userName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ⌀ {engagementStats.fastestRater.averageMinutes} mín
                    </div>
                  </div>
                )}

                {/* Slowest Rater */}
                {engagementStats.slowestRater && (
                  <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800 flex flex-col items-center justify-center text-center">
                    <Snail className="h-10 w-10 mx-auto mb-2 text-orange-600" />
                    <div className="text-sm text-muted-foreground mb-1">Hægastur</div>
                    <div className="text-lg font-bold text-orange-600 truncate max-w-full">
                      {engagementStats.slowestRater.userName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ⌀ {engagementStats.slowestRater.averageMinutes} mín
                    </div>
                  </div>
                )}

                {/* Most Generous */}
                {engagementStats.mostGenerous && (
                  <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800 flex flex-col items-center justify-center text-center">
                    <Gift className="h-10 w-10 mx-auto mb-2 text-purple-600" />
                    <div className="text-sm text-muted-foreground mb-1">Rausnarlegastur</div>
                    <div className="text-lg font-bold text-purple-600 truncate max-w-full">
                      {engagementStats.mostGenerous.userName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ⌀ {engagementStats.mostGenerous.averageRating.toFixed(2)}
                    </div>
                  </div>
                )}

                {/* Toughest Critic */}
                {engagementStats.toughestCritic && (
                  <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 dark:border-red-800 flex flex-col items-center justify-center text-center">
                    <Search className="h-10 w-10 mx-auto mb-2 text-red-600" />
                    <div className="text-sm text-muted-foreground mb-1">Strangastur</div>
                    <div className="text-lg font-bold text-red-600 truncate max-w-full">
                      {engagementStats.toughestCritic.userName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ⌀ {engagementStats.toughestCritic.averageRating.toFixed(2)}
                    </div>
                  </div>
                )}

                {/* Most Deviant Rater */}
                {engagementStats.mostDeviant && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 flex flex-col items-center justify-center text-center">
                    <Target className="h-10 w-10 mx-auto mb-2 text-blue-600" />
                    <div className="text-sm text-muted-foreground mb-1">Útlaginn</div>
                    <div className="text-lg font-bold text-blue-600 truncate max-w-full">
                      {engagementStats.mostDeviant.userName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {engagementStats.mostDeviant.deviation > 0 ? '+' : ''}{engagementStats.mostDeviant.deviation.toFixed(2)} frá meðaltali
                    </div>
                  </div>
                )}
                {/* Total Ratings */}
                {totalRatingsGiven > 0 && (
                  <div className="bg-indigo-50 dark:bg-indigo-950/20 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 flex flex-col items-center justify-center text-center">
                    <Star className="h-10 w-10 mx-auto mb-2 text-indigo-600" />
                    <div className="text-sm text-muted-foreground mb-1">Heildarfjöldi einkunna</div>
                    <div className="text-3xl font-bold text-indigo-600">
                      {totalRatingsGiven}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Section: Participation (Variable Height) */}
          {currentBeer && pendingRaters ? (
            <div className={`flex flex-col pt-4 flex-1 min-h-0 ${engagementStats ? 'border-t-2' : ''}`}>
              {/* Progress */}
              <div className="space-y-2 flex-shrink-0">
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
                    <PartyPopper className="h-16 w-16 mx-auto mb-3 text-green-600" />
                    <p className="text-lg font-medium text-green-600">
                      Allir hafa gefið einkunn!
                    </p>
                  </div>
                </div>
              ) : pendingRaters.pendingCount > 0 ? (
                /* Pending List */
                <div className="flex-1 flex flex-col min-h-0">
                  <h3 className="text-lg font-semibold text-orange-600 flex items-center gap-2 mb-2">
                    <Hourglass className="h-5 w-5" />
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
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-12">
                <Hourglass className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {tasting.status === 'closed' ? 'Takk fyrir kvöldið!' : 'Bíður eftir næsta bjór'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
