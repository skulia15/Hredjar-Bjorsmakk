'use client'

import { useEffect, useState } from 'react'

interface Participant {
  id: string
  user: {
    name: string
  }
  code: string
}

interface Rating {
  participantId: string
  score: number
  updatedAt: string
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
  const [participants, setParticipants] = useState<Participant[]>([])
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, refreshInterval)
    return () => clearInterval(interval)
  }, [tastingId, currentBeerId, refreshInterval])

  const loadData = async () => {
    try {
      // Fetch tasting with participants
      const tastingRes = await fetch(`/api/tastings/${tastingId}`)
      const tastingData = await tastingRes.json()

      // Fetch participants
      const participantsRes = await fetch(`/api/tastings/${tastingId}`)
      // Note: In a real implementation, you'd have a dedicated endpoint for participants
      // For now, we'll parse from the tasting data

      // Simulate getting ratings for current beer
      // In production, this would be a dedicated endpoint
      const allParticipants: Participant[] = [] // Would come from API
      const currentRatings: Rating[] = [] // Would come from API

      setParticipants(allParticipants)
      setRatings(currentRatings)
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

  const ratedParticipantIds = new Set(ratings.map(r => r.participantId))
  const ratedParticipants = participants.filter(p => ratedParticipantIds.has(p.id))
  const pendingParticipants = participants.filter(p => !ratedParticipantIds.has(p.id))

  return (
    <div className="bg-card p-4 rounded-lg border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Participant Status</h3>
        <div className="text-sm text-muted-foreground">
          {ratedParticipants.length} / {participants.length} rated
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{
            width: participants.length > 0
              ? `${(ratedParticipants.length / participants.length) * 100}%`
              : '0%'
          }}
        />
      </div>

      {/* Completed Ratings */}
      {ratedParticipants.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-green-600">
            ✓ Completed ({ratedParticipants.length})
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {ratedParticipants
              .sort((a, b) => {
                const ratingA = ratings.find(r => r.participantId === a.id)
                const ratingB = ratings.find(r => r.participantId === b.id)
                return (ratingB?.updatedAt || '').localeCompare(ratingA?.updatedAt || '')
              })
              .map((participant) => {
                const rating = ratings.find(r => r.participantId === participant.id)
                return (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{participant.user.name}</span>
                      <span className="text-xs text-muted-foreground">({participant.code})</span>
                    </div>
                    <span className="font-bold text-primary">
                      {rating?.score.toFixed(1)} ⭐
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Pending Ratings */}
      {pendingParticipants.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-orange-600">
            ⏳ Waiting ({pendingParticipants.length})
          </h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {pendingParticipants
              .sort((a, b) => a.user.name.localeCompare(b.user.name))
              .map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950 rounded text-sm"
                >
                  <span className="font-medium">{participant.user.name}</span>
                  <span className="text-xs text-muted-foreground">({participant.code})</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* All Done */}
      {participants.length > 0 && pendingParticipants.length === 0 && (
        <div className="text-center py-4">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-sm font-medium text-green-600">
            Everyone has rated!
          </p>
        </div>
      )}

      {/* No Participants */}
      {participants.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            No participants yet
          </p>
        </div>
      )}
    </div>
  )
}
