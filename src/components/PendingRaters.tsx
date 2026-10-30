'use client'

import { useEffect, useState } from 'react'
import { EyeOff, Hourglass, PartyPopper, Star } from 'lucide-react'

interface RatedParticipant {
  participantId: string
  name: string
  code: string
  score: number | null  // null while the tasting hides scores until everyone has rated
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
    const interval = setInterval(loadData, refreshInterval)
    return () => clearInterval(interval)
  }, [tastingId, currentBeerId, refreshInterval])

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
                <div className="flex items-center gap-2">
                  <span className="font-medium">{participant.name}</span>
                  <span className="text-xs text-muted-foreground">({participant.code})</span>
                </div>
                {participant.score === null ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" aria-label="Falið" />
                ) : (
                  <span className="font-bold text-primary">
                    {participant.score.toFixed(1)} <Star className="inline h-3.5 w-3.5 -mt-0.5 fill-yellow-400 text-yellow-400" />
                  </span>
                )}
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
                <div className="flex items-center gap-2">
                  <span className="font-medium">{participant.name}</span>
                  <span className="text-xs text-muted-foreground">({participant.code})</span>
                </div>
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
