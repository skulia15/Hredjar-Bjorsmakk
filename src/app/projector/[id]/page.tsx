'use client'

import { use, useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { CurrentBeerTimer } from '@/components/CurrentBeerTimer'
import { NudgeNotification } from '@/components/NudgeNotification'
import { useNudge } from '@/hooks/useNudge'
import { useProjectorControls } from '@/hooks/useProjectorControls'
import { fetchTasting } from '@/lib/fetchTasting'
import { AwardsReveal } from '@/components/AwardsReveal'
import { buildAwards, closestGuess, extremeRaters, type GuessAccuracy, type Rater, type TastePair, type ValuePick } from '@/lib/stats'
import { playFanfare, playPop } from '@/lib/sounds'
import { Beer as BeerIcon, Brain, Coffee, Crown, EyeOff, Gift, Hourglass, Maximize, Medal, Minimize, PartyPopper, Rocket, Search, Snail, Sparkles, Star, Tags, Target, Trophy, Volume2, VolumeX } from 'lucide-react'
import { BeerPlaceholder } from '@/components/BeerPlaceholder'
import { FoamCard } from '@/components/FoamCard'
import { SantaMug } from '@/components/SantaMug'
import { JoinQrCode } from '@/components/JoinQrCode'
import type { BeerTagCount } from '@/components/TastingNotes'
import { AnimatedLeaderboard } from '@/components/projector/AnimatedLeaderboard'
import { BeerFinishedReveal, type FinishedBeerReveal } from '@/components/projector/BeerFinishedReveal'
import { CountUp } from '@/components/projector/CountUp'
import { LobbyParticipants, type LobbyParticipant } from '@/components/projector/LobbyParticipants'
import { NoteTicker } from '@/components/projector/NoteTicker'
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
  note: string | null  // null while scores are hidden
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
  paused?: PendingParticipant[]
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
  // Only a 404 means the tasting is gone; an outage keeps retrying with the next poll
  const [notFound, setNotFound] = useState(false)
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
  const { isFullscreen, toggleFullscreen, soundOn, toggleSound, tagsOn, toggleTags } = useProjectorControls()

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
      const tastingResult = await fetchTasting<Tasting>(params.id)
      if (tastingResult.kind === 'not-found') {
        setNotFound(true)
        setTasting(null)
        return
      }
      // Couldn't reach the server: keep showing the last good screen until the next poll
      if (tastingResult.kind === 'unavailable') return
      const tastingData = tastingResult.data
      setNotFound(false)
      setTasting(tastingData)

      // Load scores (top beers)
      const scoresResponse = await fetch(`/api/tastings/${params.id}/scores`)
      const scoresData: ScoresData = await scoresResponse.json()
      setScores(scoresData)

      // Load analytics
      // Keep the last good analytics if a poll fails, rather than storing the error body
      const analyticsResponse = await fetch(`/api/tastings/${params.id}/analytics`)
      if (analyticsResponse.ok) {
        setAnalytics(await analyticsResponse.json())
      }

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BeerIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl text-muted-foreground">Hleður skjávarpasýn...</p>
        </div>
      </div>
    )
  }

  if (!tasting && !notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-3xl font-bold">Næ ekki sambandi</p>
          <p className="text-xl text-muted-foreground">Reyni aftur…</p>
        </div>
      </div>
    )
  }

  if (!tasting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Smökkun fannst ekki</h2>
        </div>
      </div>
    )
  }

  const currentBeer = tasting.beers.find(b => b.id === tasting.currentBeerId)
  // No beer on and none tasted yet: still gathering people, so show the join code
  const notStarted = !currentBeer && !tasting.beers.some(b => b.status === 'finished')
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
  // Ratings come newest first; the ticker rotates through the five newest notes
  const beerNotes = (pendingRaters?.rated || [])
    .filter((r): r is RatedParticipant & { note: string } => !!r.note?.trim())
    .slice(0, 5)
    .map(r => ({ key: r.participantId, note: r.note.trim() }))
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

  const statTiles = [
    engagementStats?.fastestRater && {
      icon: Rocket,
      label: 'Hraðastur',
      name: engagementStats.fastestRater.userName,
      detail: `⌀ ${engagementStats.fastestRater.averageMinutes} mín`,
    },
    engagementStats?.slowestRater && {
      icon: Snail,
      label: 'Hægastur',
      name: engagementStats.slowestRater.userName,
      detail: `⌀ ${engagementStats.slowestRater.averageMinutes} mín`,
    },
    engagementStats?.mostGenerous && {
      icon: Gift,
      label: 'Rausnarlegastur',
      name: engagementStats.mostGenerous.userName,
      detail: `⌀ ${engagementStats.mostGenerous.averageRating.toFixed(2)}`,
    },
    engagementStats?.toughestCritic && {
      icon: Search,
      label: 'Strangastur',
      name: engagementStats.toughestCritic.userName,
      detail: `⌀ ${engagementStats.toughestCritic.averageRating.toFixed(2)}`,
    },
    engagementStats?.mostDeviant && {
      icon: Target,
      label: 'Útlaginn',
      name: engagementStats.mostDeviant.userName,
      detail: `${engagementStats.mostDeviant.deviation > 0 ? '+' : ''}${engagementStats.mostDeviant.deviation.toFixed(2)} frá meðaltali`,
    },
    totalRatingsGiven > 0 && {
      icon: Star,
      label: 'Einkunnir alls',
      name: String(totalRatingsGiven),
      detail: null,
    },
  ].filter(Boolean) as Array<{ icon: typeof Star; label: string; name: string; detail: string | null }>

  return (
    <div className="min-h-screen lg:h-screen w-screen overflow-x-hidden lg:overflow-hidden relative flex flex-col gap-6 2xl:gap-8 px-4 pt-6 pb-8 lg:px-8 2xl:px-14 2xl:pt-10 2xl:pb-12">
      {/* Awards reveal once the tasting is closed */}
      {showingAwards && (
        <AwardsReveal awards={awards} winnerName={scores?.beers[0]?.name} onClose={closeAwards} />
      )}
      {awards.length > 0 && awardsDismissed && (
        <button
          onClick={() => setAwardsDismissed(false)}
          className="wiggle fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 px-5 min-h-12 rounded-full bg-cranberry text-white font-extrabold shadow-lg"
        >
          <Medal className="h-5 w-5" />Sýna verðlaun
        </button>
      )}

      {/* Beer finished: drumroll, score and where it landed */}
      {finishedReveal && !showingAwards && (
        <BeerFinishedReveal key={finishedReveal.beerId} reveal={finishedReveal} onClose={closeFinishedReveal} showTags={tagsOn} />
      )}

      {/* Nudge Notification Overlay */}
      {showNudge && (
        <NudgeNotification
          onComplete={() => setShowNudge(false)}
          duration={3000}
          sound={soundOn}
        />
      )}

      <header className="flex flex-wrap lg:flex-nowrap items-center gap-6 relative">
        <SantaMug className="w-14 2xl:w-16 h-auto shrink-0" />
        <div className="min-w-0 shrink">
          <div className="text-base 2xl:text-xl font-semibold tracking-[0.2em] uppercase text-gold">Hreðjar Jólabjórsmakk</div>
          <h1 className="text-4xl 2xl:text-5xl leading-none truncate">{tasting.title}</h1>
        </div>
        {/* Progress through the tasting */}
        <div className="flex-1 min-w-0 max-w-2xl ml-auto">
          <ProgressStrip beers={tasting.beers} currentBeerId={tasting.currentBeerId} />
        </div>
        <div className="flex gap-1 shrink-0 opacity-60 hover:opacity-100 transition-opacity">
          <button
            onClick={toggleTags}
            className="p-2.5 rounded-xl hover:bg-pine-light"
            aria-pressed={tagsOn}
            aria-label={tagsOn ? 'Fela bragðlýsingar' : 'Sýna bragðlýsingar'}
            title={tagsOn ? 'Fela bragðlýsingar' : 'Sýna bragðlýsingar'}
          >
            <Tags className={`h-6 w-6 ${tagsOn ? "" : "opacity-40"}`} />
          </button>
          <button
            onClick={toggleSound}
            className="p-2.5 rounded-xl hover:bg-pine-light"
            aria-label={soundOn ? 'Slökkva á hljóði' : 'Kveikja á hljóði'}
            title={soundOn ? 'Slökkva á hljóði' : 'Kveikja á hljóði'}
          >
            {soundOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl hover:bg-pine-light"
            aria-label={isFullscreen ? 'Hætta í fullum skjá' : 'Fullur skjár'}
            title={isFullscreen ? 'Hætta í fullum skjá' : 'Fullur skjár'}
          >
            {isFullscreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* One column on small screens, three on a projector */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[minmax(0,29fr)_minmax(0,47fr)_minmax(0,24fr)] gap-6 2xl:gap-8 relative">
        {/* Column 1: Top 6 Beers */}
        <FoamCard as="section" aria-label="Efstu 6" tone="pine" size="lg" className="px-6 pt-3 pb-6 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2.5">
            <h2 className="text-3xl flex items-center gap-3 mb-1.5">
              <Crown className="h-8 w-8 text-gold" fill="currentColor" />
              Efstu 6
            </h2>
            {!scores || scores.beers.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-mint">
                <BeerIcon className="h-12 w-12" />
                <p className="text-xl">Engir bjórar klárðir ennþá</p>
              </div>
            ) : (
              <AnimatedLeaderboard beers={scores.beers} limit={6} />
            )}
          </div>
        </FoamCard>

        {/* Column 2: Current Beer */}
        <FoamCard as="section" aria-label="Núverandi bjór" size="lg" className="px-10 pt-4 pb-8 flex flex-col items-center text-center gap-2 overflow-y-auto">
          {currentBeer ? (
            <>
              <div className="text-xl font-extrabold tracking-[0.18em] uppercase text-cranberry">Núverandi bjór</div>
              <div key={currentBeer.id} className="flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 duration-500">
                <div className="beer-bob mt-1 w-28 h-28 2xl:w-36 2xl:h-36 shrink-0 rounded-full bg-gold-soft flex items-center justify-center overflow-hidden">
                  {currentBeer.imageUrl ? (
                    <Image
                      src={currentBeer.imageUrl}
                      alt={currentBeer.name}
                      width={160}
                      height={160}
                      className="object-contain max-h-[80%] w-auto"
                    />
                  ) : (
                    <BeerPlaceholder className="h-3/4 w-auto text-[#7A3B12]" />
                  )}
                </div>
                <h2 className="mt-1 text-5xl 2xl:text-6xl leading-none">{currentBeer.name}</h2>
                <p className="text-2xl 2xl:text-[1.75rem] text-muted-foreground">
                  {currentBeer.brewery}
                  {currentBeer.containerSize && currentBeer.containerType && ` · ${currentBeer.containerSize} ml ${currentBeer.containerType}`}
                </p>
                {currentBeer.currentSince && currentBeer.status !== 'finished' && (
                  <div className="text-lg">
                    <CurrentBeerTimer currentSince={currentBeer.currentSince} colorCoded={false} size="md" />
                  </div>
                )}
              </div>


              <div className="mt-auto w-full grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-10 items-end text-left">
                <div className="flex flex-col gap-1">
                  {pendingRaters?.scoresHidden ? (
                    <span className="flex flex-col gap-2 text-muted-foreground">
                      <EyeOff className="h-12 w-12" />
                      <span className="text-2xl font-semibold leading-tight">Einkunnir birtast þegar allir hafa gefið einkunn</span>
                      <span className="text-5xl font-extrabold text-ink tabular-nums">
                        {pendingRaters.ratedCount} / {pendingRaters.totalParticipants}
                      </span>
                    </span>
                  ) : liveAverage !== null ? (
                    <div
                      // Remount on reveal so the average counts up from zero
                      key={`average-${currentBeer.id}-${justRevealed ? 'revealed' : 'live'}`}
                      className={`flex flex-col gap-1 ${justRevealed ? 'animate-in zoom-in-90 duration-700' : ''}`}
                    >
                      {justRevealed ? (
                        <span className="inline-flex items-center gap-2 text-2xl font-extrabold text-holly">
                          <Sparkles className="h-6 w-6" /> Einkunnir birtar!
                        </span>
                      ) : (
                        <span className="text-xl font-semibold text-muted-foreground">Meðaleinkunn</span>
                      )}
                      {/* Sized to the narrow column beside the score bars; "8.00" must never wrap */}
                      <span className="text-[length:min(6rem,5.5vw)] whitespace-nowrap leading-[0.9] font-extrabold text-cranberry tabular-nums">
                        <CountUp value={liveAverage} durationMs={justRevealed ? 1800 : 600} />
                      </span>
                      <span className="flex flex-wrap gap-x-4 mt-3 text-lg font-semibold text-muted-foreground">
                        <span>{currentBeerRatings.length} einkunn{currentBeerRatings.length !== 1 ? 'ir' : ''}</span>
                        {highestScore !== null && lowestScore !== null && (
                          <>
                            <span>Hæsta {highestScore.toFixed(1)}</span>
                            <span>Lægsta {lowestScore.toFixed(1)}</span>
                          </>
                        )}
                      </span>
                      {bestGuess && (
                        <span className="mt-2 inline-flex items-center gap-2 text-2xl font-extrabold text-purple-600 animate-in fade-in fill-mode-both duration-700 [animation-delay:1800ms]">
                          <Brain className="h-5 w-5" />
                          {bestGuess.userName} giskaði næst: {bestGuess.guess.toFixed(1)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <>
                      <span className="text-xl font-semibold text-muted-foreground">Meðaleinkunn</span>
                      <span className="text-3xl font-semibold text-muted-foreground">Engar einkunnir ennþá</span>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  {/* Score Distribution; remounts on reveal so the bars grow in */}
                  {currentBeerRatings.length > 0 && (
                    <ScoreBars key={`bars-${currentBeer.id}-${justRevealed ? 'revealed' : 'live'}`} scores={currentBeerRatings.map(r => r.score)} />
                  )}
                  {/* Flavor tags; shown even while scores are hidden, they don't give the score away */}
                  {tagsOn && pendingRaters && pendingRaters.tags.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <span className="text-xl font-semibold text-muted-foreground">Bragðlýsingar</span>
                      <TagCloud tags={pendingRaters.tags} />
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : notStarted ? (
            // Before the first beer the screen is a lobby: big scan-to-join code. Once the
            // tasting is under way the code stays off the screen
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <p className="text-5xl font-extrabold">Skannaðu til að taka þátt</p>
              <JoinQrCode tastingId={tasting.id} size={240} showUrl />
              <LobbyParticipants participants={tasting.participants} />
            </div>
          ) : tasting.status !== 'closed' ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <Hourglass className="h-20 w-20 text-cranberry" />
              <p className="text-5xl font-extrabold text-ink">Næsti bjór kemur bráðum</p>
              <p className="text-2xl">Skál á meðan!</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Trophy className="h-20 w-20 text-gold" />
              <p className="text-4xl font-extrabold">Smökkun lokið</p>
            </div>
          )}
        </FoamCard>

        {/* Column 3: Participation */}
        <FoamCard as="section" aria-label="Framvinda" tone="pine" size="lg" className="px-6 pt-3 pb-6 flex flex-col gap-5 min-h-0">
          <h2 className="text-3xl">Framvinda</h2>
          {!currentBeer || !pendingRaters ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-mint">
              <Hourglass className="h-12 w-12" />
              <p className="text-xl">{tasting.status === 'closed' ? 'Takk fyrir kvöldið!' : 'Bíður eftir næsta bjór'}</p>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2.5">
                <span className="text-8xl leading-[0.9] font-extrabold text-gold tabular-nums">{pendingRaters.ratedCount}</span>
                <span className="text-3xl font-semibold text-mint">/ {pendingRaters.totalParticipants} búin</span>
              </div>
              <div className="h-5 rounded-full bg-pine-deep overflow-hidden shrink-0">
                <div
                  className="h-full rounded-full bg-gold transition-all duration-500"
                  style={{
                    width: pendingRaters.totalParticipants > 0
                      ? `${(pendingRaters.ratedCount / pendingRaters.totalParticipants) * 100}%`
                      : '0%'
                  }}
                />
              </div>
              {pendingRaters.paused && pendingRaters.paused.length > 0 && (
                <p className="flex items-center gap-2 text-xl text-mint">
                  <Coffee className="h-5 w-5 shrink-0" aria-hidden />
                  Í pásu: {pendingRaters.paused.map(p => p.name).join(', ')}
                </p>
              )}

              {pendingRaters.totalParticipants > 0 && pendingRaters.pendingCount === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                  <PartyPopper className="h-24 w-24 text-gold" strokeWidth={1.6} />
                  <p className="text-4xl font-extrabold leading-tight">Allir hafa gefið einkunn!</p>
                  <p className="text-2xl text-mint">Skál!</p>
                </div>
              ) : pendingRaters.pendingCount > 0 ? (
                <div className="flex-1 min-h-0 flex flex-col gap-3">
                  <span className="text-xl font-semibold text-mint">Bíður eftir {pendingRaters.pendingCount}</span>
                  <div className="flex flex-wrap content-start gap-2.5 overflow-y-auto">
                    {pendingRaters.pending.map((participant) => (
                      <span
                        key={participant.participantId}
                        className="inline-flex items-center gap-2.5 pl-2.5 pr-4 py-2 rounded-full bg-cream text-ink text-2xl font-semibold"
                      >
                        <span className="w-8 h-8 rounded-full bg-gold shrink-0" aria-hidden />
                        {participant.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Notes people wrote, one at a time; this column has the room the beer card lacks */}
              {beerNotes.length > 0 && (
                <div className="mt-auto flex flex-col gap-2 shrink-0">
                  <span className="text-xl font-semibold text-mint">Athugasemdir</span>
                  <NoteTicker notes={beerNotes} />
                </div>
              )}
            </>
          )}
        </FoamCard>
      </div>

      {/* Tasting-wide stats, kept up between beers */}
      {statTiles.length > 0 && (
        <footer aria-label="Tölfræði" className="grid grid-cols-2 lg:grid-cols-6 gap-4 relative">
          {statTiles.map((tile) => (
            <div key={tile.label} className="flex items-center gap-3.5 px-5 py-4 rounded-[20px] bg-pine-deep min-w-0">
              <span className="w-12 h-12 shrink-0 rounded-[14px] bg-pine-light flex items-center justify-center">
                <tile.icon className="h-6 w-6 text-gold" />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="text-base text-mint">{tile.label}</span>
                <span className="text-2xl font-extrabold truncate">{tile.name}</span>
                {tile.detail && <span className="text-sm text-mint truncate">{tile.detail}</span>}
              </span>
            </div>
          ))}
        </footer>
      )}
    </div>
  )
}
