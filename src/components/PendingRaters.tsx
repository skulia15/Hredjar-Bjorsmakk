'use client'

import { useEffect, useState } from 'react'
import { Coffee, EyeOff, Hourglass, PartyPopper, Pause, Play, Star } from 'lucide-react'
import { ParticipantAvatar } from '@/components/ChristmasAvatar'
import { usePolling } from '@/hooks/usePolling'

interface RatedParticipant {
  participantId: string
  name: string
  code: string
  avatar?: string | null
  score: number | null  // null while the tasting hides scores until everyone has rated
  paused?: boolean
  submittedAt: string
}

interface PendingParticipant {
  participantId: string
  name: string
  code: string
  avatar?: string | null
}

interface PendingRatersData {
  currentBeerId: string
  totalParticipants: number
  ratedCount: number
  pendingCount: number
  rated: RatedParticipant[]
  pending: PendingParticipant[]
  paused?: PendingParticipant[]
}

interface PendingRatersProps {
  tastingId: string
  currentBeerId: string
  refreshInterval?: number
  onRemoveParticipant?: (participantId: string) => void
  onNudge?: () => void
}

export function PendingRaters({
  tastingId,
  currentBeerId,
  refreshInterval = 3000,
  onRemoveParticipant,
  onNudge
}: PendingRatersProps) {
  const [data, setData] = useState<PendingRatersData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [tastingId, currentBeerId])

  usePolling(() => loadData(), refreshInterval)

  const loadData = async () => {
    try {
      const response = await fetch(
        `/api/tastings/${tastingId}/current/pending-raters`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch pending raters')
      }

      const responseData = await response.json()
      setData(responseData)
    } catch (error) {
      console.error('Error loading pending raters:', error)
    } finally {
      setLoading(false)
    }
  }

  const setPaused = async (participantId: string, paused: boolean) => {
    try {
      const response = await fetch(`/api/tastings/${tastingId}/participants/${participantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused })
      })
      if (!response.ok) throw new Error('Failed to update participant')
      await loadData()
    } catch (error) {
      console.error('Error pausing participant:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-card p-4 rounded-lg border">
        <h3 className="font-semibold mb-3">Staða þátttakenda</h3>
        <p className="text-sm text-muted-foreground">Hleður...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-card p-4 rounded-lg border">
        <h3 className="font-semibold mb-3">Staða þátttakenda</h3>
        <p className="text-sm text-muted-foreground">Gat ekki hlaðið gögnum</p>
      </div>
    )
  }

  return (
    <div className="bg-card p-4 rounded-lg border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Staða þátttakenda</h3>
        <div className="text-sm text-muted-foreground">
          {data.ratedCount} / {data.totalParticipants} gefið einkunn
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{
            width: data.totalParticipants > 0
              ? `${(data.ratedCount / data.totalParticipants) * 100}%`
              : '0%'
          }}
        />
      </div>

      {/* Completed Ratings */}
      {data.ratedCount > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-green-600">
            ✓ Lokið ({data.ratedCount})
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {data.rated.map((participant) => (
              <div
                key={participant.participantId}
                className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <ParticipantAvatar avatar={participant.avatar} seed={participant.participantId} className="w-10 h-10 shrink-0" />
                  <span className="font-medium">{participant.name}</span>
                  {participant.paused && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Coffee className="h-3.5 w-3.5" /> í pásu
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Rated, then left: pause now so the next beer doesn't wait on them */}
                  <button
                    onClick={() => setPaused(participant.participantId, !participant.paused)}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                      participant.paused ? 'text-green-700 hover:bg-green-100' : 'text-orange-700 hover:bg-orange-100'
                    }`}
                  >
                    {participant.paused
                      ? <><Play className="h-3.5 w-3.5" /> Halda áfram</>
                      : <><Pause className="h-3.5 w-3.5" /> Pása</>}
                  </button>
                  {participant.score === null ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" aria-label="Falið" />
                  ) : (
                    <span className="font-bold text-primary">
                      {participant.score.toFixed(1)} <Star className="inline h-3.5 w-3.5 -mt-0.5 fill-yellow-400 text-yellow-400" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Ratings */}
      {data.pendingCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-orange-600">
              <Hourglass className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />Bíður ({data.pendingCount})
            </h4>
            {onNudge && (
              <button
                onClick={onNudge}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors"
              >
                Drífa sig!
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {data.pending.map((participant) => (
              <div
                key={participant.participantId}
                className="flex items-center justify-between gap-2 p-2 bg-orange-50 dark:bg-orange-950 rounded text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <ParticipantAvatar avatar={participant.avatar} seed={participant.participantId} className="w-10 h-10 shrink-0" />
                  <span className="font-medium">{participant.name}</span>
                </div>
                <div className="flex items-center gap-1">
                <button
                  onClick={() => setPaused(participant.participantId, true)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-colors"
                  title="Setja í pásu: ekki beðið eftir viðkomandi fyrr en hann gefur einkunn aftur"
                >
                  <Pause className="h-3.5 w-3.5" /> Pása
                </button>
                {onRemoveParticipant && (
                  <button
                    onClick={() => onRemoveParticipant(participant.participantId)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1"
                    title="Fjarlægja þátttakanda"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paused: stepped away, not waited on */}
      {data.paused && data.paused.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            <Coffee className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />Í pásu ({data.paused.length})
          </h4>
          <div className="space-y-1">
            {data.paused.map((participant) => (
              <div
                key={participant.participantId}
                className="flex items-center justify-between gap-2 p-2 bg-muted rounded text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <ParticipantAvatar avatar={participant.avatar} seed={participant.participantId} className="w-10 h-10 shrink-0" />
                  <span className="font-medium">{participant.name}</span>
                </div>
                <button
                  onClick={() => setPaused(participant.participantId, false)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors"
                >
                  <Play className="h-3.5 w-3.5" /> Halda áfram
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Done */}
      {data.totalParticipants > 0 && data.pendingCount === 0 && (
        <div className="text-center py-4">
          <PartyPopper className="h-10 w-10 mx-auto mb-2 text-green-600" />
          <p className="text-sm font-medium text-green-600">
            Allir hafa gefið einkunn!
          </p>
        </div>
      )}

      {/* No Participants */}
      {data.totalParticipants === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Engir þátttakendur ennþá
          </p>
        </div>
      )}
    </div>
  )
}
