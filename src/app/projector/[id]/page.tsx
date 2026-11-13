'use client'

import { use, useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { NudgeNotification } from '@/components/NudgeNotification'
import { useNudge } from '@/hooks/useNudge'
import { useProjectorControls } from '@/hooks/useProjectorControls'
import { fetchTasting } from '@/lib/fetchTasting'
import { AwardsReveal } from '@/components/AwardsReveal'
import { buildAwards, closestGuess, extremeRaters, generousAndHarsh, soleWinner, winnersName, type GuessAccuracy, type Rater, type TastePair, type ValuePick } from '@/lib/stats'
import { playFanfare, playPop } from '@/lib/sounds'
import { beerAwards, type BeerAward } from '@/lib/beerAwards'
import { Beer as BeerIcon, Coffee, Crown, MessageSquareOff, Gift, Hourglass, Maximize, Medal, Minimize, PartyPopper, Rocket, Search, Snail, Star, Tags, Target, Trophy, Volume2, VolumeX } from 'lucide-react'
import { FoamCard } from '@/components/FoamCard'
import { SantaMug } from '@/components/SantaMug'
import { ParticipantAvatar } from '@/components/ChristmasAvatar'
import { JoinQrCode } from '@/components/JoinQrCode'
import type { BeerTagCount } from '@/components/TastingNotes'
import { AnimatedLeaderboard } from '@/components/projector/AnimatedLeaderboard'
import { BeerFinishedReveal, type FinishedBeerReveal } from '@/components/projector/BeerFinishedReveal'
import { LobbyParticipants, type LobbyParticipant } from '@/components/projector/LobbyParticipants'
import { NoteStack } from '@/components/projector/NoteTicker'
import { CurrentBeerPanel } from '@/components/projector/CurrentBeerPanel'
import { ProgressStrip } from '@/components/projector/ProgressStrip'
import { ScoreRevealPanel } from '@/components/projector/ScoreRevealPanel'
import { SelectedBeerPanel, type SelectedBeerRating } from '@/components/projector/SelectedBeerPanel'

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
  abv?: number | null
}

interface Tasting {
  id: string
  title: string
  status: string
  createdAt: string
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
  abv?: number | null
}

interface ScoresData {
  beers: BeerScore[]
}

interface RatedParticipant {
  participantId: string
  name: string
  code: string
  avatar?: string | null
  score: number | null  // null while the tasting hides scores until everyone has rated
  groupGuess: number | null
  note: string | null  // null while scores are hidden
  submittedAt: string
  ratedAt?: string  // first rating; edits move submittedAt
}

interface PendingParticipant {
  participantId: string
  name: string
  code: string
  avatar?: string | null
  imageUrl?: string | null
}

interface PendingRatersData {
  currentBeerId: string
  totalParticipants: number
  ratedCount: number
  pendingCount: number
  scoresHidden: boolean
  notesHidden?: boolean
  hiddenNoteCount?: number
  tags: BeerTagCount[]
  rated: RatedParticipant[]
  pending: PendingParticipant[]
  paused?: PendingParticipant[]
}

interface RatingsDetailData {
  participants: Array<{ id: string; userName: string; avatar?: string | null }>
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
/** The current beer's awards from its ratings so far; none while its scores are hidden */
function currentBeerAwards(pending: PendingRatersData | null, beers: Beer[]): BeerAward[] {
  if (!pending) return []
  const since = beers.find(b => b.id === pending.currentBeerId)?.currentSince
  return beerAwards(
    pending.rated.flatMap(r => r.score === null ? [] : [{ participantId: r.participantId, name: r.name, avatar: r.avatar, score: r.score, ratedAt: r.ratedAt ?? r.submittedAt }]),
    since ? new Date(since).toISOString() : null
  )
}

async function loadFinishedReveal(tastingId: string, beer: Beer, scores: ScoresData, awards: BeerAward[]): Promise<FinishedBeerReveal | null> {
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
    abv: beer.abv,
    imageUrl: beer.imageUrl,
    average: score.average,
    count: score.count,
    rank: score.rank,
    totalRanked: scores.beers.length,
    ...extremeRaters(raters),
    closestGuess: guess ?? undefined,
    tags: beerDetail?.tags ?? [],
    awards,
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
  // When the last nudge came in; keys the overlay so a second nudge during the first restarts it
  const [nudgeAt, setNudgeAt] = useState<number | null>(null)
  const [awardsDismissed, setAwardsDismissed] = useState(false)
  const [finishedReveal, setFinishedReveal] = useState<FinishedBeerReveal | null>(null)
  // The current beer whose hidden scores were just revealed, for the reveal animation
  const [revealedBeerId, setRevealedBeerId] = useState<string | null>(null)
  const closeAwards = useCallback(() => setAwardsDismissed(true), [])
  const closeFinishedReveal = useCallback(() => setFinishedReveal(null), [])
  // A finished beer clicked on the leaderboard, shown in the middle card instead of the current one
  const [selectedBeerId, setSelectedBeerId] = useState<string | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<{ beerId: string; ratings: SelectedBeerRating[]; tags: BeerTagCount[] } | null>(null)
  const { isFullscreen, toggleFullscreen, soundOn, toggleSound, tagsOn, toggleTags } = useProjectorControls()

  // What the previous poll saw, to spot transitions; undefined until the first load
  const previous = useRef<{
    currentBeerId: string | null
    hiddenBeerId: string | null
    participantIds: Set<string>
    // Gone from the API once the beer is finished, so kept from the last poll for its overlay
    awards: BeerAward[]
  } | undefined>(undefined)

  useEffect(() => {
    loadAllData()
    // Refresh every 5 seconds
    const interval = setInterval(loadAllData, 5000)
    return () => clearInterval(interval)
  }, [params.id])

  // Load who gave the selected beer what; a finished beer's ratings don't change, so once is enough
  useEffect(() => {
    if (!selectedBeerId) return
    let cancelled = false
    fetch(`/api/tastings/${params.id}/ratings-detail`)
      .then(response => (response.ok ? response.json() : null))
      .then((detail: RatingsDetailData | null) => {
        if (cancelled || !detail) return
        const beerDetail = detail.beers.find(b => b.beerId === selectedBeerId)
        if (!beerDetail) return
        const ratings = detail.participants.flatMap(p => {
          const score = beerDetail.ratings[p.id]
          return score == null ? [] : [{ participantId: p.id, userName: p.userName, avatar: p.avatar, score }]
        })
        setSelectedDetail({ beerId: selectedBeerId, ratings, tags: beerDetail.tags })
      })
      .catch(err => console.error('Error loading selected beer ratings:', err))
    return () => { cancelled = true }
  }, [params.id, selectedBeerId])

  // Escape goes back to the current beer
  useEffect(() => {
    if (!selectedBeerId) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedBeerId(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedBeerId])

  // Projector shows every nudge (component will auto-hide after duration)
  const handleIncomingNudge = useCallback(() => setNudgeAt(Date.now()), [])

  useNudge({ tastingId: params.id, participantId: null, onNudge: handleIncomingNudge })

  // A slow poll can outlast the 5s interval; overlapping ones would compare against a stale
  // previous.current and fire the reveal or fanfare twice, so a tick is skipped while one's running
  const polling = useRef(false)

  const loadAllData = async () => {
    if (polling.current) return
    polling.current = true
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
      // A failed poll keeps the last good scores rather than storing the error body; skipping the rest
      // leaves previous.current alone, so a finished-beer reveal still fires on the next good poll
      const scoresResponse = await fetch(`/api/tastings/${params.id}/scores`)
      if (!scoresResponse.ok) return
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
        awards: currentBeerAwards(pendingData, tastingData.beers),
      }
      if (!before) return

      // The beer on screen was just finished
      const finishedBeer = before.currentBeerId && before.currentBeerId !== tastingData.currentBeerId
        ? tastingData.beers.find(b => b.id === before.currentBeerId && b.status === 'finished')
        : undefined
      if (finishedBeer) {
        loadFinishedReveal(params.id, finishedBeer, scoresData, before.awards)
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
      polling.current = false
      setLoading(false)
    }
  }

  // Helper function to get engagement stats
  const getEngagementStats = () => {
    if (!analytics?.participantStats || analytics.participantStats.length === 0) return null

    const statsWithRatings = analytics.participantStats.filter(p => p.ratingsCount > 0)
    if (statsWithRatings.length === 0) return null

    // Names everyone sharing the top or bottom average; neither shows when all averaged the same
    const extremes = generousAndHarsh(statsWithRatings)
    const mostGenerous = extremes?.generous ?? null
    const toughestCritic = extremes?.harsh ?? null

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
        // A shared first place has no single winner to have a biggest fan
        winner: scores ? soleWinner(scores.beers) : undefined,
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
  // Ratings come newest first: the right column and the reveal both page through all of them
  const allNotes = (pendingRaters?.rated || [])
    .filter((r): r is RatedParticipant & { note: string } => !!r.note?.trim())
    .map(r => ({ key: r.participantId, avatar: r.avatar, note: r.note.trim() }))
  const beerNotes = allNotes
  const liveAverage = currentBeerRatings.length > 0
    ? currentBeerRatings.reduce((sum, r) => sum + r.score, 0) / currentBeerRatings.length
    : null
  const highestScore = currentBeerRatings.length > 0
    ? Math.max(...currentBeerRatings.map(r => r.score))
    : null
  const lowestScore = currentBeerRatings.length > 0
    ? Math.min(...currentBeerRatings.map(r => r.score))
    : null

  // Everyone has rated and the scores are out: the current beer takes the whole screen.
  // Derived from the poll rather than the reveal transition, so a reloaded projector shows it too
  const expanded = !!currentBeer && currentBeer.status !== 'finished' && liveAverage !== null &&
    !!pendingRaters && !pendingRaters.scoresHidden &&
    pendingRaters.totalParticipants > 0 && pendingRaters.pendingCount === 0
  // Saw the hidden scores come out just now: count up from zero and celebrate
  const justRevealed = expanded && revealedBeerId === currentBeer.id
  // Name whoever guessed the group average best
  const bestGuess = expanded && liveAverage !== null
    ? closestGuess(
        currentBeerRatings.flatMap(r => (r.groupGuess === null ? [] : [{ userName: r.name, guess: r.groupGuess }])),
        liveAverage
      )
    : null

  // The picked beer, unless it dropped off the board or everyone just rated and the current beer took the screen
  const selectedScore = !expanded ? scores?.beers.find(b => b.beerId === selectedBeerId) : undefined
  const selectedBeer = selectedScore && tasting.beers.find(b => b.id === selectedScore.beerId)

  const engagementStats = getEngagementStats()

  // Calculate overall tasting stats
  const totalRatingsGiven = analytics?.participantStats?.reduce((sum, p) => sum + p.ratingsCount, 0) || 0

  const statTiles = [
    engagementStats?.fastestRater && {
      icon: Rocket,
      label: 'Hraðastur',
      accent: '#F2A93B',
      name: engagementStats.fastestRater.userName,
      participantId: engagementStats.fastestRater.participantId,
      detail: `⌀ ${engagementStats.fastestRater.averageMinutes} mín`,
    },
    engagementStats?.slowestRater && {
      icon: Snail,
      label: 'Hægastur',
      accent: '#CFE0D3',
      name: engagementStats.slowestRater.userName,
      participantId: engagementStats.slowestRater.participantId,
      detail: `⌀ ${engagementStats.slowestRater.averageMinutes} mín`,
    },
    engagementStats?.mostGenerous && {
      icon: Gift,
      label: 'Rausnarlegastur',
      accent: '#E2575E',
      name: engagementStats.mostGenerous.userName,
      participantId: engagementStats.mostGenerous.participantId,
      detail: `⌀ ${engagementStats.mostGenerous.averageRating.toFixed(2)}`,
    },
    engagementStats?.toughestCritic && {
      icon: Search,
      label: 'Strangastur',
      accent: '#8EC5A8',
      name: engagementStats.toughestCritic.userName,
      participantId: engagementStats.toughestCritic.participantId,
      detail: `⌀ ${engagementStats.toughestCritic.averageRating.toFixed(2)}`,
    },
    engagementStats?.mostDeviant && {
      icon: Target,
      label: 'Útlaginn',
      accent: '#F6E3BC',
      name: engagementStats.mostDeviant.userName,
      participantId: engagementStats.mostDeviant.participantId,
      detail: `${engagementStats.mostDeviant.deviation > 0 ? '+' : ''}${engagementStats.mostDeviant.deviation.toFixed(2)} frá meðaltali`,
    },
    totalRatingsGiven > 0 && {
      icon: Star,
      label: 'Einkunnir alls',
      accent: '#F2A93B',
      name: String(totalRatingsGiven),
      detail: null,
    },
  ].filter(Boolean) as Array<{ icon: typeof Star; label: string; accent: string; name: string; participantId?: string; detail: string | null }>
  // Each participant's avatar, for the faces on the stat tiles and the end-of-night awards
  const avatarById = Object.fromEntries(tasting.participants.map(p => [p.id, p.avatar]))

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen lg:h-screen w-screen overflow-x-hidden lg:overflow-hidden relative flex flex-col gap-4 2xl:gap-6 px-3 pt-3 pb-3 lg:px-4 2xl:px-8 2xl:pt-5 2xl:pb-6">
      {/* Awards reveal once the tasting is closed */}
      {showingAwards && (
        <AwardsReveal awards={awards} winnerName={scores ? winnersName(scores.beers) : undefined} avatars={avatarById} onClose={closeAwards} />
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
      {nudgeAt && (
        <NudgeNotification
          key={nudgeAt}
          onComplete={() => setNudgeAt(null)}
          duration={3000}
          sound={soundOn}
        />
      )}

      <header className="flex flex-wrap lg:flex-nowrap items-center gap-6 relative">
        <SantaMug className="w-10 2xl:w-12 h-auto shrink-0" />
        <h1 className="min-w-0 truncate text-xl 2xl:text-2xl font-extrabold tracking-[0.2em] uppercase text-gold">
          Hreðjar Jólabjórsmakk {new Date(tasting.createdAt).getFullYear()}
        </h1>
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
      {/* When everyone has rated, the side columns fold away and the current beer fills the screen */}
      <div
        className={`flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[var(--columns)] lg:transition-[grid-template-columns,column-gap] lg:duration-700 lg:ease-in-out relative ${
          expanded ? 'gap-y-4 gap-x-0' : 'gap-4 2xl:gap-6'
        }`}
        style={{ '--columns': expanded ? 'minmax(0,0fr) minmax(0,1fr) minmax(0,0fr)' : 'minmax(0,35fr) minmax(0,41fr) minmax(0,24fr)' } as React.CSSProperties}
      >
        {/* Column 1: Top 6 Beers */}
        <FoamCard as="section" aria-label="Efstu 6" tone="pine" size="lg" folded={expanded} className="px-4 pt-3 pb-4 flex flex-col">
          <div className="flex-1 min-h-0 flex flex-col gap-2.5">
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
              <AnimatedLeaderboard beers={scores.beers} limit={6} selectedBeerId={selectedScore?.beerId} onSelect={setSelectedBeerId} />
            )}
          </div>
        </FoamCard>

        {/* Column 2: Current Beer */}
        <FoamCard
          as="section"
          aria-label="Núverandi bjór"
          size="lg"
          // relative: the outgoing panel is pinned in place here while it crossfades out
          className={`relative flex flex-col items-center gap-2 overflow-y-auto ${
            expanded ? 'px-12 pt-5 pb-8 gap-5 2xl:gap-7 text-left' : 'px-6 pt-4 pb-4 text-center'
          }`}
        >
          {currentBeer && (expanded || !selectedScore) ? (
            // Everyone rated: a crossfade while the side columns fold. The outgoing card is pinned
            // where it was (popLayout) and fades as the reveal rises in over it, so the card is
            // never blank; the reveal's slight delay keeps most of its reflow out of sight.
            // Reverses the same way when the next beer comes on
            <AnimatePresence mode="popLayout" initial={false}>
              {expanded ? (
                <motion.div
                  key={`reveal-${currentBeer.id}`}
                  className="w-full flex-1 min-h-0 flex flex-col gap-5 2xl:gap-7"
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.6, ease: 'easeOut' } }}
                  exit={{ opacity: 0, transition: { duration: 0.35 } }}
                >
                  <ScoreRevealPanel
                    // Remount per beer and on the reveal, so the average counts up and the bars grow in
                    key={`reveal-${currentBeer.id}-${justRevealed ? 'revealed' : 'done'}`}
                    beer={currentBeer}
                    scores={currentBeerRatings.map(r => r.score)}
                    average={liveAverage}
                    bestGuess={bestGuess}
                    tags={pendingRaters.tags}
                    raters={pendingRaters.ratedCount}
                    notes={allNotes}
                    justRevealed={justRevealed}
                    showTags={tagsOn}
                    awards={currentBeerAwards(pendingRaters, tasting.beers)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={`live-${currentBeer.id}`}
                  className="w-full flex-1 min-h-0 flex flex-col"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.15, duration: 0.45 } }}
                  exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.45 } }}
                >
                  <CurrentBeerPanel
                    beer={currentBeer}
                    scoresHidden={!!pendingRaters?.scoresHidden}
                    ratedCount={pendingRaters?.ratedCount ?? 0}
                    scores={currentBeerRatings.map(r => r.score)}
                    average={liveAverage}
                    tags={pendingRaters?.tags ?? []}
                    showTags={tagsOn}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          ) : selectedScore ? (
            <SelectedBeerPanel
              key={selectedScore.beerId}
              beer={{ ...selectedBeer, ...selectedScore, imageUrl: selectedScore.imageUrl ?? selectedBeer?.imageUrl }}
              rank={selectedScore.rank}
              average={selectedScore.average}
              ratings={selectedDetail?.beerId === selectedScore.beerId ? selectedDetail.ratings : null}
              tags={selectedDetail?.beerId === selectedScore.beerId ? selectedDetail.tags : []}
              showTags={tagsOn}
              backLabel={currentBeer ? 'Núverandi bjór' : 'Til baka'}
              onBack={() => setSelectedBeerId(null)}
            />
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
        <FoamCard as="section" aria-label="Framvinda" tone="pine" size="lg" folded={expanded} className="px-4 pt-3 pb-4 flex flex-col gap-5 min-h-0">
          <h2 className="text-3xl">Framvinda</h2>
          {!currentBeer || !pendingRaters ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-mint">
              <Hourglass className="h-12 w-12" />
              <p className="text-xl">{tasting.status === 'closed' ? 'Takk fyrir kvöldið!' : 'Bíður eftir næsta bjór'}</p>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2.5">
                <span className="text-7xl leading-[0.9] font-extrabold text-gold tabular-nums">{pendingRaters.ratedCount}</span>
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
                beerNotes.length > 0 ? (
                  // One line when notes are showing, so the note bubble stays inside the card
                  <p className="flex items-center gap-3 text-2xl font-extrabold">
                    <PartyPopper className="h-9 w-9 shrink-0 text-gold" strokeWidth={1.6} />
                    Allir búnir. Skál!
                  </p>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                    <PartyPopper className="h-24 w-24 text-gold" strokeWidth={1.6} />
                    <p className="text-4xl font-extrabold leading-tight">Allir hafa gefið einkunn!</p>
                    <p className="text-2xl text-mint">Skál!</p>
                  </div>
                )
              ) : pendingRaters.pendingCount > 0 ? (
                <div className={`min-h-0 flex flex-col gap-3 ${beerNotes.length > 0 ? 'shrink' : 'flex-1'}`}>
                  <span className="text-xl font-semibold text-mint">Bíður eftir {pendingRaters.pendingCount}</span>
                  <div className="flex flex-wrap content-start gap-2 overflow-y-auto">
                    {pendingRaters.pending.map((participant) => (
                      <span
                        key={participant.participantId}
                        className="inline-flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-cream text-ink text-xl 2xl:text-2xl font-semibold"
                      >
                        <ParticipantAvatar avatar={participant.avatar} seed={participant.participantId} className="w-14 h-14 2xl:w-16 2xl:h-16 shrink-0 shadow-sm" />
                        {participant.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Notes people wrote, newest first and stacked; this column has the room the beer card lacks */}
              {beerNotes.length > 0 ? (
                <div className="flex-1 min-h-0 flex flex-col gap-3">
                  <span className="text-xl font-semibold text-mint">Athugasemdir</span>
                  <NoteStack notes={beerNotes} />
                </div>
              ) : pendingRaters.notesHidden && (pendingRaters.hiddenNoteCount ?? 0) > 0 ? (
                // The tasting holds notes back until everyone has rated: say they're coming, without any of them
                <p className="flex items-start gap-2.5 text-xl text-mint">
                  <MessageSquareOff className="h-6 w-6 shrink-0 mt-0.5" aria-hidden />
                  {pendingRaters.hiddenNoteCount} athugasemd{pendingRaters.hiddenNoteCount === 1 ? '' : 'ir'} birt{pendingRaters.hiddenNoteCount === 1 ? 'ist' : 'ast'} þegar allir hafa gefið einkunn
                </p>
              ) : null}
            </>
          )}
        </FoamCard>
      </div>

      {/* Tasting-wide stats, kept up between beers */}
      {/* Folds away with the side columns while the current beer fills the screen */}
      {statTiles.length > 0 && (
        <div
          aria-hidden={expanded || undefined}
          className={`grid transition-[grid-template-rows,opacity] duration-700 ease-in-out ${expanded ? 'grid-rows-[0fr] opacity-0 -mt-4 2xl:-mt-6' : 'grid-rows-[1fr] opacity-100'}`}
        >
        {/* As many columns as there are stats: early in the night four tiles left a third of the strip empty */}
        <footer
          aria-label="Tölfræði"
          className="min-h-0 overflow-hidden grid grid-cols-2 lg:grid-cols-[repeat(var(--stat-count),minmax(0,1fr))] gap-4 relative"
          style={{ '--stat-count': statTiles.length } as React.CSSProperties}
        >
          {statTiles.map((tile) => (
            // Medal tile: each award wears its own accent on the top edge, ring and label
            <div
              key={tile.label}
              // Tighter on a short projector, where the beer card needs the height more than the medals do
              className="flex flex-col items-center justify-center text-center gap-1.5 px-4 pt-4 pb-3.5 [@media(max-height:1000px)]:gap-0.5 [@media(max-height:1000px)]:pt-2.5 [@media(max-height:1000px)]:pb-2 rounded-[20px] bg-pine-deep border-t-4 border-t-[var(--acc)] min-w-0"
              style={{ '--acc': tile.accent } as React.CSSProperties}
            >
              {tile.participantId ? (
                // The winner's face, ringed in the award's accent, with its icon as a badge
                <span className="relative shrink-0 mb-1 [@media(max-height:1000px)]:mb-0">
                  <ParticipantAvatar
                    avatar={avatarById[tile.participantId]}
                    seed={tile.participantId}
                    className="w-16 h-16 2xl:w-20 2xl:h-20 [@media(max-height:1000px)]:w-12 [@media(max-height:1000px)]:h-12 ring-[3px] ring-[var(--acc)] shadow-md"
                  />
                  <span className="absolute -bottom-1 -right-2 w-8 h-8 [@media(max-height:1000px)]:w-6 [@media(max-height:1000px)]:h-6 rounded-full bg-[var(--acc)] text-pine-deep flex items-center justify-center ring-2 ring-pine-deep">
                    <tile.icon className="h-4 w-4 [@media(max-height:1000px)]:h-3.5 [@media(max-height:1000px)]:w-3.5" />
                  </span>
                </span>
              ) : (
                <span className="w-12 h-12 2xl:w-14 2xl:h-14 [@media(max-height:1000px)]:w-9 [@media(max-height:1000px)]:h-9 [@media(max-height:1000px)]:mb-0 shrink-0 mb-1 rounded-full border-2 border-[var(--acc)] bg-[color-mix(in_srgb,var(--acc)_14%,transparent)] text-[var(--acc)] flex items-center justify-center">
                  <tile.icon className="h-6 w-6" />
                </span>
              )}
              {tile.detail ? (
                <>
                  <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-[var(--acc)] max-w-full truncate">{tile.label}</span>
                  <span className="text-2xl font-extrabold max-w-full truncate">{tile.name}</span>
                  <span className="text-sm text-mint tabular-nums max-w-full truncate">{tile.detail}</span>
                </>
              ) : (
                // A plain count: the number leads, the label sits under it
                <>
                  <span className="text-4xl font-extrabold tabular-nums">{tile.name}</span>
                  <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-[var(--acc)] max-w-full truncate">{tile.label}</span>
                </>
              )}
            </div>
          ))}
        </footer>
        </div>
      )}
    </div>
    </MotionConfig>
  )
}
