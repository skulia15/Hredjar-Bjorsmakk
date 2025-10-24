'use client'

import { useEffect, useState } from 'react'

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

interface PendingRatersProps {
  tastingId: string
  currentBeerId: string
  refreshInterval?: number
}

export function PendingRaters({
  tastingId,
  currentBeerId,
  refreshInterval = 3000
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
        <h3 className="font-semibold mb-3">Participant Status</h3>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-card p-4 rounded-lg border">
        <h3 className="font-semibold mb-3">Participant Status</h3>
        <p className="text-sm text-muted-foreground">Unable to load data</p>
      </div>
    )
  }

  return (
    <div className="bg-card p-4 rounded-lg border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Participant Status</h3>
        <div className="text-sm text-muted-foreground">
          {data.ratedCount} / {data.totalParticipants} rated
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
            ✓ Completed ({data.ratedCount})
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
                <span className="font-bold text-primary">
                  {participant.score.toFixed(1)} ⭐
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Ratings */}
      {data.pendingCount > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-orange-600">
            ⏳ Waiting ({data.pendingCount})
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {data.pending.map((participant) => (
              <div
                key={participant.participantId}
                className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950 rounded text-sm"
              >
                <span className="font-medium">{participant.name}</span>
                <span className="text-xs text-muted-foreground">({participant.code})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Done */}
      {data.totalParticipants > 0 && data.pendingCount === 0 && (
        <div className="text-center py-4">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-sm font-medium text-green-600">
            Everyone has rated!
          </p>
        </div>
      )}

      {/* No Participants */}
      {data.totalParticipants === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            No participants yet
          </p>
        </div>
      )}
    </div>
  )
}
