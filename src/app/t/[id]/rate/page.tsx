'use client'

import { use, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { WrapUpOverlay } from '@/components/WrapUpOverlay'
import { useActiveTasting } from '@/components/ReturnToTastingButton'
import { LeaderboardWaiting } from '@/components/LeaderboardWaiting'
import { StarRating } from '@/components/StarRating'
import { CurrentBeerTimer } from '@/components/CurrentBeerTimer'

interface Beer {
  id: string
  name: string
  brewery: string
  style?: string
  abv?: number
  containerSize?: number
  containerType?: string
  priceISK?: number
  status: string
  currentSince?: Date | string | null
  finishedAt?: Date | string | null
  averageRating?: number
  ratingCount?: number
}

interface Tasting {
  id: string
  title: string
  status: string
  currentBeerId?: string | null
  beers: Beer[]
  currentUserIsLeader?: boolean
}

export default function RatePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const router = useRouter()
  const [tasting, setTasting] = useState<Tasting | null>(null)
  const [rating, setRating] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [participantId, setParticipantId] = useState('')
  const [participantInfo, setParticipantInfo] = useState<{
    name?: string
    code?: string
  } | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [ratingStats, setRatingStats] = useState<{
    totalParticipants: number
    ratedCount: number
    pendingCount: number
    pending: Array<{ participantId: string; name: string; code: string }>
  } | null>(null)

  // Wrap-up overlay state
  const [showWrapUp, setShowWrapUp] = useState(false)
  const [wrapUpData, setWrapUpData] = useState<{
    beerName: string
    brewery: string
    average: number
    count: number
  } | null>(null)
  const [previousBeerId, setPreviousBeerId] = useState<string | null>(null)

  // Leaderboard waiting state (shown after wrap-up completes)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  const { setActiveTasting } = useActiveTasting()

  // Set active tasting once on mount
  useEffect(() => {
    setActiveTasting(params.id)
  }, [params.id, setActiveTasting])

  const loadTasting = useCallback(async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) {
      setLoading(true)
    }
    try {
      const response = await fetch(`/api/tastings/${params.id}`)
      if (!response.ok) {
        console.error('Failed to load tasting:', response.statusText)
        setTasting(null)
        return
      }
      const data = await response.json()
      setTasting(data)
    } catch (error) {
      console.error('Error loading tasting:', error)
      setTasting(null)
    } finally {
      if (showLoadingSpinner) {
        setLoading(false)
      }
    }
  }, [params.id])

  const loadRatingStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/tastings/${params.id}/current/pending-raters`)
      if (!response.ok) {
        return
      }
      const data = await response.json()
      setRatingStats({
        totalParticipants: data.totalParticipants,
        ratedCount: data.ratedCount,
        pendingCount: data.pendingCount,
        pending: data.pending || []
      })
    } catch (error) {
      console.error('Error loading rating stats:', error)
    }
  }, [params.id])

  // Load initial data and set up polling
  useEffect(() => {
    // Initial load with spinner
    loadTasting(true)

    // Get participant ID from session
    const stored = localStorage.getItem(`participant_${params.id}`)
    if (stored) {
      const data = JSON.parse(stored)
      setParticipantId(data.participantId)
      setCheckingAuth(false)

      // Fetch participant details including name
      fetch(`/api/participants/${data.participantId}`)
        .then(res => res.json())
        .then(participant => {
          setParticipantInfo({
            name: participant.user?.name,
            code: participant.code
          })
        })
        .catch(err => console.error('Error loading participant info:', err))
    } else {
      // No participant ID found - redirect to join page
      router.push(`/t/${params.id}`)
      return
    }

    // Poll for updates every 3 seconds (without loading spinner)
    const interval = setInterval(() => {
      loadTasting(false)
      loadRatingStats()
    }, 3000)
    return () => clearInterval(interval)
  }, [params.id, loadTasting, loadRatingStats, router])

  // Derive current beer from tasting state
  const currentBeer = tasting?.beers?.find(b => b.id === tasting.currentBeerId)

  // Load existing rating and stats when current beer changes
  useEffect(() => {
    if (currentBeer && participantId) {
      loadRatingStats()

      // Load existing rating for this beer
      fetch(`/api/tastings/${params.id}/current/pending-raters`)
        .then(res => res.json())
        .then(data => {
          // Check if this participant has already rated
          const existingRating = data.rated?.find((r: { participantId: string; score: number }) =>
            r.participantId === participantId
          )
          if (existingRating) {
            setRating(existingRating.score)
          } else {
            // Reset to 0 for new beer
            setRating(0)
          }
        })
        .catch(err => console.error('Error loading existing rating:', err))
    }
  }, [currentBeer?.id, participantId, loadRatingStats, params.id])

  // Detect when a beer has been finished and show wrap-up overlay
  useEffect(() => {
    if (!tasting) return

    const currentBeerId = tasting.currentBeerId

    // Only update if the beer ID actually changed
    if (currentBeerId !== previousBeerId) {
      // If current beer changed and we had a previous beer
      if (previousBeerId && previousBeerId !== currentBeerId) {
        // Check if the previous beer is now finished
        const finishedBeer = tasting.beers?.find(
          b => b.id === previousBeerId && b.status === 'finished'
        )

        if (finishedBeer) {
          // Show wrap-up overlay with the finished beer's data
          setWrapUpData({
            beerName: finishedBeer.name,
            brewery: finishedBeer.brewery,
            average: finishedBeer.averageRating || 0,
            count: finishedBeer.ratingCount || 0
          })
          setShowWrapUp(true)
          setShowLeaderboard(false) // Hide leaderboard when showing wrap-up
        }
      } else if (currentBeerId) {
        // If a new current beer is set, hide leaderboard
        setShowLeaderboard(false)
      }

      // Update previous beer ID for next comparison
      setPreviousBeerId(currentBeerId || null)
    }
  }, [tasting, previousBeerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentBeer) {
      setMessage('No beer selected')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (!participantId) {
      setMessage('Please join the tasting first')
      setTimeout(() => setMessage(''), 5000)
      return
    }

    setSubmitting(true)
    setMessage('')

    try {
      const response = await fetch(`/api/tastings/${params.id}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beerId: currentBeer.id,
          participantId,
          score: rating
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit rating')
      }

      setMessage('Rating submitted!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error submitting rating')
      setTimeout(() => setMessage(''), 5000)
    } finally {
      setSubmitting(false)
    }
  }

  if (checkingAuth || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍺</div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!tasting) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Tasting Not Found</h2>
          <Link href="/" className="text-primary hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  if (tasting.status === 'draft') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">{tasting.title}</h2>
          <p className="text-muted-foreground mb-4">
            This tasting hasn&apos;t started yet. Please wait for the organizer to begin.
          </p>
          <div className="text-6xl mb-4">⏳</div>
        </div>
      </div>
    )
  }

  // Redirect to scores page for closed tastings
  if (tasting.status === 'closed') {
    router.push(`/t/${params.id}/scores`)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍺</div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    )
  }

  // Show leaderboard if no current beer and we've shown wrap-up before
  if (!currentBeer && (showLeaderboard || tasting.beers?.some(b => b.status === 'finished'))) {
    return <LeaderboardWaiting tastingId={params.id} />
  }

  // Show basic waiting state if no current beer and no finished beers yet
  if (!currentBeer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">{tasting.title}</h2>
          <p className="text-muted-foreground mb-4">
            Waiting for the next beer...
          </p>
          <div className="text-6xl mb-4">🍺</div>
          <Link
            href={`/t/${params.id}/scores`}
            className="text-primary hover:underline"
          >
            View Scores
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Leader Controls Access */}
        {tasting.currentUserIsLeader && (
          <div className="text-center">
            <Link
              href={`/t/${params.id}/admin`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Switch to leader View
            </Link>
          </div>
        )}

        {/* User Info */}
        {participantInfo?.code && (
          <div className="bg-muted/50 px-4 py-2 rounded-lg border text-center">
            <div className="text-sm">
              <span className="text-muted-foreground">Your code: </span>
              <span className="font-semibold">{participantInfo.code}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">{tasting.title}</h1>
          <p className="text-sm text-muted-foreground">Rate the current beer</p>
        </div>

        {/* Current Beer Card */}
        <div className="bg-card p-6 rounded-lg border space-y-4">
          <div className="text-center">
            <div className="text-5xl mb-3">🍺</div>
            <h2 className="text-2xl font-bold">{currentBeer.name}</h2>
            <p className="text-lg text-muted-foreground">{currentBeer.brewery}</p>
            {currentBeer.style && (
              <p className="text-sm text-muted-foreground mt-1">
                {currentBeer.style} {currentBeer.abv && `• ${currentBeer.abv}%`}
              </p>
            )}
            <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
              {currentBeer.containerSize && currentBeer.containerType && (
                <span className="text-sm text-muted-foreground">
                  {currentBeer.containerSize}ml {currentBeer.containerType}
                </span>
              )}
              {currentBeer.priceISK && (
                <span className="text-sm font-semibold text-green-600">
                  {currentBeer.priceISK} kr
                </span>
              )}
            </div>
            {currentBeer.currentSince && (
              <div className="flex justify-center mt-2">
                <CurrentBeerTimer
                  currentSince={currentBeer.currentSince}
                  colorCoded={false}
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Rating Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-center">
                Your Rating (1.0 - 10.0)
              </label>
              <div className="flex justify-center">
                <StarRating
                  value={rating}
                  onChange={setRating}
                  max={10}
                  size={36}
                  showNumeric={true}
                />
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-md text-sm text-center ${
                message.includes('Error')
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-green-500/10 text-green-600'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </form>
        </div>

        {/* Rating Progress */}
        {ratingStats && (
          <div className="bg-card p-4 rounded-lg border space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Participant Progress</span>
              <span className="text-muted-foreground">
                {ratingStats.ratedCount} / {ratingStats.totalParticipants} gefin einkunn
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{
                  width: ratingStats.totalParticipants > 0
                    ? `${(ratingStats.ratedCount / ratingStats.totalParticipants) * 100}%`
                    : '0%'
                }}
              />
            </div>

            {/* Status message */}
            {ratingStats.pendingCount > 0 ? (
              <p className="text-xs text-muted-foreground text-center">
                {ratingStats.pendingCount <= 3 && ratingStats.pending.length > 0 ? (
                  <>
                    Waiting for{' '}
                    {ratingStats.pending.map((p, idx) => {
                      const isLast = idx === ratingStats.pending.length - 1
                      const isSecondToLast = idx === ratingStats.pending.length - 2
                      return (
                        <span key={p.participantId}>
                          {p.name}
                          {!isLast && (isSecondToLast ? ' and ' : ', ')}
                        </span>
                      )
                    })}
                  </>
                ) : (
                  <>Bíður eftir {ratingStats.pendingCount} {ratingStats.pendingCount === 1 ? 'aðila' : 'aðilum'}</>
                )}
              </p>
            ) : (
              <p className="text-xs text-green-600 text-center font-medium">
                🎉 Allir hafa gefið einkunn!
              </p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          {tasting.currentUserIsLeader && (
            <Link
              href={`/t/${params.id}/admin`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Leiðtogasýn
            </Link>
          )}
          <Link
            href={`/t/${params.id}/scores`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Skoða stigatöflu →
          </Link>
        </div>
      </div>

      {/* Wrap-up overlay shown when beer is finished */}
      {showWrapUp && wrapUpData && (
        <WrapUpOverlay
          beerName={wrapUpData.beerName}
          brewery={wrapUpData.brewery}
          average={wrapUpData.average}
          count={wrapUpData.count}
          onComplete={() => {
            // After wrap-up completes, hide wrap-up
            setShowWrapUp(false)
            setWrapUpData(null)

            // Only show leaderboard if there's no new current beer
            // If there's a new current beer, it will be displayed automatically
            if (!tasting?.currentBeerId) {
              setShowLeaderboard(true)
            }
          }}
          minDuration={5000}
        />
      )}
    </div>
  )
}
