'use client'

import { use, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { NudgeNotification } from '@/components/NudgeNotification'
import { useNudge } from '@/hooks/useNudge'
import { PersonalStats } from '@/components/PersonalStats'
import { Beer as BeerIcon, ChevronDown, ChevronUp, Crown, Table, Users } from 'lucide-react'
import { StatCard } from '@/components/StatCard'
import { FoamCard } from '@/components/FoamCard'
import { ParticipantAvatar } from '@/components/ChristmasAvatar'
import { RankMedal } from '@/components/RankMedal'
import { usePolling } from '@/hooks/usePolling'
import { ShareResultsButton } from '@/components/ShareResultsButton'
import { type BeerTagCount, TagChips, TastingNotes } from '@/components/TastingNotes'

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
  avatar?: string | null
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
  participantStylePreferences?: Array<{
    participantId: string
    userName: string
    favoriteStyle: { style: string; average: number; count: number } | null
    leastFavoriteStyle: { style: string; average: number; count: number } | null
    allStylePreferences: Array<{ style: string; average: number; count: number }>
  }>
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
    tags: BeerTagCount[]
    notes: Array<{ participantId: string; userName: string; avatar?: string | null; note: string }>
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
  }, [params.id])

  // Refresh scores every 5 seconds during active tasting
  usePolling(() => loadData(), 5000)

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
      // Keep the last good data when a poll fails, rather than storing the error body and crashing on it
      if (scoresResponse.ok) setScores(await scoresResponse.json())
      if (analyticsResponse.ok) setAnalytics(await analyticsResponse.json())
      if (ratingsDetailResponse.ok) setRatingsDetail(await ratingsDetailResponse.json())
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BeerIcon className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
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

  const podium = scores.beers.slice(0, 3)
  // Display order on the podium: 2nd, 1st, 3rd
  const podiumOrder = [podium[1], podium[0], podium[2]]
  const rest = scores.beers.slice(3)

  return (
    <div className="min-h-screen px-4 pt-4 pb-8 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <header className="min-w-0">
          <div className="text-[0.8125rem] font-semibold tracking-[0.14em] uppercase text-gold truncate">{scores.title}</div>
          <h1 className="text-3xl leading-tight">Stigatafla</h1>
        </header>
        {scores.status === 'active' && (
          <p className="text-sm text-mint -mt-3">
            Uppfærslur í beinni • {scores.beers.length} bjórum gefin einkunn
          </p>
        )}

        {/* Scores */}
        {scores.beers.length === 0 ? (
          <div className="text-center py-12">
            <BeerIcon className="h-16 w-16 mx-auto mb-4 text-mint" />
            <p className="text-mint">
              Engir bjórar hafa fengið einkunn ennþá
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <section aria-label="Verðlaunapallur" className="grid grid-cols-3 gap-2.5 items-end pt-2">
              {podiumOrder.map((beer, i) => {
                if (!beer) return <div key={`empty-${i}`} />
                const place = i === 1 ? 1 : i === 0 ? 2 : 3
                const tone = place === 1
                  ? 'min-h-[168px] bg-gold text-ink'
                  : place === 2
                    ? 'min-h-[120px] bg-[#D9D3C4] text-ink'
                    : 'min-h-[96px] bg-cranberry text-white'
                return (
                  <div key={beer.beerId} className="flex flex-col items-center gap-2 text-center min-w-0">
                    {place === 1 && <Crown className="h-8 w-8 text-gold" fill="currentColor" />}
                    <div className="flex flex-col items-center gap-0.5 min-w-0 w-full [container-type:inline-size]">
                      <div className={`${place === 1 ? 'text-[length:min(1.0625rem,15cqi)] font-extrabold' : 'text-[length:min(0.9375rem,14cqi)] font-semibold'} leading-tight line-clamp-3`}>
                        {beer.name}
                      </div>
                      <div className="text-[length:min(0.75rem,11cqi)] text-mint truncate max-w-full">{beer.brewery}</div>
                    </div>
                    {/* Sized to the column (cqi) so large phone text can't push the score out of its bar */}
                    <div className="w-full [container-type:inline-size]">
                      <div className="foam" style={{ height: 10, backgroundSize: '16px 10px', backgroundImage: 'radial-gradient(circle at 8px 10px, var(--foam) 8px, transparent 8.5px)' }} />
                      {/* The score is the headline; the bar height already says the place */}
                      <div className={`${tone} rounded-b-[14px] flex flex-col items-center justify-center gap-0.5`}>
                        <span className="text-[length:min(0.75rem,11cqi)] font-extrabold uppercase tracking-wider">{beer.rank}. sæti</span>
                        <span className={`${place === 1 ? 'text-[length:min(2.25rem,30cqi)]' : 'text-[length:min(1.75rem,28cqi)]'} leading-none font-extrabold tabular-nums`}>{beer.average.toFixed(2)}</span>
                        <span className="text-[length:min(0.75rem,11cqi)] font-semibold">{beer.count} eink.</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </section>

            {rest.length > 0 && showAllBeers && (
              <FoamCard as="section" aria-label="Restin af listanum" className="px-4 pt-1 pb-2">
                <ol>
                  {rest.map((beer) => (
                    <li key={beer.beerId} className="flex flex-wrap items-center gap-x-3 gap-y-1 min-h-14 py-2 border-b border-cream-line last:border-b-0">
                      <span className="w-8 h-8 shrink-0 rounded-full bg-cream-dim flex items-center justify-center text-[0.9375rem] font-extrabold">
                        {beer.rank}
                      </span>
                      <span className="flex-1 min-w-[min(9rem,100%)] flex flex-col">
                        <span className="text-base font-semibold">{beer.name}</span>
                        <span className="text-[0.8125rem] text-muted-foreground truncate">
                          {beer.brewery}
                          {beer.containerSize && beer.containerType && ` · ${beer.containerSize} ml ${beer.containerType}`}
                        </span>
                        <span className="mt-1">
                          <TagChips
                            tags={ratingsDetail?.beers.find(b => b.beerId === beer.beerId)?.tags ?? []}
                            limit={3}
                          />
                        </span>
                      </span>
                      <span className="text-right shrink-0 ml-auto">
                        <span className="block text-lg font-extrabold text-holly">{beer.average.toFixed(2)}</span>
                        <span className="block text-xs text-muted-foreground">{beer.count} eink.</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </FoamCard>
            )}

            {rest.length > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowAllBeers(!showAllBeers)}
                  className="inline-flex items-center gap-2 min-h-12 px-5 rounded-full bg-pine-light hover:bg-pine-line transition-colors font-semibold"
                >
                  {showAllBeers ? (
                    <>
                      Fela stigatöflu
                      <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Sjá alla stigatöflu
                      <span className="text-mint">({rest.length} í viðbót)</span>
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="flex justify-center">
              <ShareResultsButton
                tastingId={params.id}
                title={scores.title}
                resultsKey={`${scores.status}:${scores.beers.map(b => `${b.beerId}=${b.average}`).join(',')}`}
              />
            </div>
          </div>
        )}

        {/* Personal stats for the viewer once the tasting is over */}
        {isClient && scores.status === 'closed' && participantId && ratingsDetail && (
          <PersonalStats
            participantId={participantId}
            participants={ratingsDetail.participants}
            beers={ratingsDetail.beers}
            favoriteStyle={analytics?.participantStylePreferences?.find(p => p.participantId === participantId)?.favoriteStyle}
          />
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
          // Folded by default: on a phone the full table is several screens long
          <StatCard
            tone="section"
            className="mt-8"
            icon={Table}
            title="Einkunnatafla"
            description={`Einkunnir hvers þátttakanda fyrir hvern bjór (${ratingsDetail.beers.length} bjórar × ${ratingsDetail.participants.length})`}
          >
            <RatingsTable participants={ratingsDetail.participants} beers={ratingsDetail.beers} />
          </StatCard>
        )}

        {isClient && ratingsDetail && <TastingNotes beers={ratingsDetail.beers} />}

        {/* User Statistics - Only show for closed tastings */}
        {scores.status === 'closed' && analytics && analytics.participantStats.length > 0 && (
          <StatCard
            tone="section"
            className="mt-8"
            icon={Users}
            title="Ítarleg tölfræði þátttakenda"
            description={`Meðaleinkunn: ${analytics.overview.overallAverage.toFixed(2)} • ${analytics.overview.totalRatings} einkunnir samtals`}
          >
            {/* Each person folds open on tap; the summary row alone answers "who rated what on average" */}
            <div className="space-y-2">
              {analytics.participantStats.map((participant) => (
                <details
                  key={participant.participantId}
                  className="group rounded-lg border bg-card"
                >
                  <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 p-4 [&::-webkit-details-marker]:hidden">
                    <ParticipantAvatar avatar={participant.avatar} seed={participant.participantId} className="h-12 w-12 shrink-0" />
                    <span className="flex-1 min-w-[min(10rem,100%)]">
                      <h3 className="font-bold text-lg leading-tight">{participant.userName}</h3>
                      <span className="block text-sm text-muted-foreground">
                        {participant.ratingsCount} af {participant.possibleRatings} bjórum ({participant.engagementRate}%)
                      </span>
                    </span>
                    <span className="ml-auto flex items-center gap-3">
                      <span className="text-right">
                        <span className="block text-2xl font-bold text-primary tabular-nums">
                          {participant.averageRating.toFixed(2)}
                        </span>
                        <span className="block text-xs text-muted-foreground">meðaleinkunn</span>
                      </span>
                      <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                    </span>
                  </summary>
                  <div className="space-y-3 px-4 pb-4">

                    {/* Top 3 beers */}
                    {participant.topBeers && participant.topBeers.length > 0 && (
                      <div className="space-y-2">
                        <div className="font-semibold text-muted-foreground text-sm">Uppáhalds bjórar</div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {participant.topBeers.map((beer, index) => (
                            <div key={beer.beerId} className="p-3 rounded bg-muted/50 relative">
                              <div className="absolute top-2 right-2 opacity-50">
                                <RankMedal rank={index + 1} className="h-6 w-6" />
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
                </details>
              ))}
            </div>
          </StatCard>
        )}

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
