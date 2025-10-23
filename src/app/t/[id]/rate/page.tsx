'use client'

import { use, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
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
}

export default function RatePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const [tasting, setTasting] = useState<Tasting | null>(null)
  const [rating, setRating] = useState<number>(5.0)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [participantId, setParticipantId] = useState('')

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

  // Load initial data and set up polling
  useEffect(() => {
    // Initial load with spinner
    loadTasting(true)

    // Get participant ID from session
    const stored = localStorage.getItem(`participant_${params.id}`)
    if (stored) {
      setParticipantId(JSON.parse(stored).participantId)
    }

    // Poll for updates every 3 seconds (without loading spinner)
    const interval = setInterval(() => loadTasting(false), 3000)
    return () => clearInterval(interval)
  }, [params.id, loadTasting])

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

  const currentBeer = tasting?.beers?.find(b => b.id === tasting.currentBeerId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentBeer || !participantId) return

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

      if (!response.ok) throw new Error('Failed to submit rating')

      setMessage('Rating submitted!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error submitting rating')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
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
            This tasting hasn't started yet. Please wait for the organizer to begin.
          </p>
          <div className="text-6xl mb-4">⏳</div>
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

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <Link
            href={`/t/${params.id}/scores`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View Scores →
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
            // After wrap-up completes, show leaderboard
            setShowWrapUp(false)
            setWrapUpData(null)
            setShowLeaderboard(true)
          }}
          minDuration={5000}
        />
      )}
    </div>
  )
}
