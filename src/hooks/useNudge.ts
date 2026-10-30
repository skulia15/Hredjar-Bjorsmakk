import { useEffect, useRef } from 'react'

const POLL_INTERVAL_MS = 2000

interface NudgeResponse {
  nudgedAt: string | null
  pendingParticipantIds: string[]
}

interface UseNudgeOptions {
  tastingId: string
  // Only fire when this participant was pending; null fires on every nudge (projector)
  participantId: string | null
  enabled?: boolean
  onNudge: () => void
}

/**
 * Polls the tasting's latest nudge and calls onNudge when a new one arrives.
 * The first response is only a baseline, so opening a page never replays an old nudge.
 */
export function useNudge({ tastingId, participantId, enabled = true, onNudge }: UseNudgeOptions) {
  const onNudgeRef = useRef(onNudge)

  useEffect(() => {
    onNudgeRef.current = onNudge
  }, [onNudge])

  useEffect(() => {
    if (!enabled) return

    // undefined = no baseline yet
    let lastSeenNudgedAt: string | null | undefined
    let cancelled = false

    const poll = async () => {
      try {
        const response = await fetch(`/api/tastings/${tastingId}/nudge`)
        if (!response.ok) return
        const data: NudgeResponse = await response.json()
        if (cancelled) return

        if (lastSeenNudgedAt === undefined) {
          lastSeenNudgedAt = data.nudgedAt
          return
        }
        if (data.nudgedAt === lastSeenNudgedAt) return
        lastSeenNudgedAt = data.nudgedAt

        if (participantId === null || data.pendingParticipantIds.includes(participantId)) {
          onNudgeRef.current()
        }
      } catch (error) {
        console.error('[Nudge] Poll failed:', error)
      }
    }

    poll()
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [tastingId, participantId, enabled])
}
