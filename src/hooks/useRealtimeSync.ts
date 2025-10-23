import { useEffect, useRef, useState } from 'react'

export type SSEEventType = 'connected' | 'currentChanged' | 'finished' | 'scoresUpdated' | 'tastingClosed'

interface SSEEvent {
  type: SSEEventType
  tastingId: string
  version?: number
  [key: string]: any
}

interface UseRealtimeSyncOptions {
  tastingId: string
  onEvent?: (event: SSEEvent) => void
  onCurrentChanged?: (data: { currentBeerId: string | null; version: number }) => void
  onFinished?: (data: { beerId: string; average: number; count: number; version: number }) => void
  onScoresUpdated?: (data: { version: number }) => void
  onTastingClosed?: (data: { status: string; version: number }) => void
  enablePollingFallback?: boolean
  pollingInterval?: number
}

/**
 * Hook for real-time synchronization with SSE (Server-Sent Events)
 * Falls back to polling if SSE connection fails
 */
export function useRealtimeSync({
  tastingId,
  onEvent,
  onCurrentChanged,
  onFinished,
  onScoresUpdated,
  onTastingClosed,
  enablePollingFallback = true,
  pollingInterval = 2000
}: UseRealtimeSyncOptions) {
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usingPolling, setUsingPolling] = useState(false)

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 3
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Handle incoming events
  const handleEvent = (event: SSEEvent) => {
    // Call general event handler
    onEvent?.(event)

    // Call specific handlers
    switch (event.type) {
      case 'currentChanged':
        onCurrentChanged?.({
          currentBeerId: event.currentBeerId,
          version: event.version || 0
        })
        break
      case 'finished':
        onFinished?.({
          beerId: event.beerId,
          average: event.average,
          count: event.count,
          version: event.version || 0
        })
        break
      case 'scoresUpdated':
        onScoresUpdated?.({ version: event.version || 0 })
        break
      case 'tastingClosed':
        onTastingClosed?.({
          status: event.status,
          version: event.version || 0
        })
        break
    }
  }

  // SSE connection setup
  const setupSSE = () => {
    try {
      const eventSource = new EventSource(`/api/tastings/${tastingId}/stream`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('[SSE] Connected')
        setConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
      }

      eventSource.onerror = (err) => {
        console.error('[SSE] Connection error:', err)
        setConnected(false)
        eventSource.close()

        reconnectAttemptsRef.current++

        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.log('[SSE] Max reconnect attempts reached, falling back to polling')
          setError('SSE connection failed, using polling')

          if (enablePollingFallback) {
            setupPolling()
          }
        } else {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 10000)
          console.log(`[SSE] Reconnecting in ${delay}ms...`)

          setTimeout(() => {
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
              setupSSE()
            }
          }, delay)
        }
      }

      // Listen for all event types
      const eventTypes: SSEEventType[] = ['connected', 'currentChanged', 'finished', 'scoresUpdated', 'tastingClosed']

      eventTypes.forEach((eventType) => {
        eventSource.addEventListener(eventType, (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data)
            handleEvent({ ...data, type: eventType })
          } catch (error) {
            console.error(`[SSE] Error parsing ${eventType} event:`, error)
          }
        })
      })

    } catch (error) {
      console.error('[SSE] Setup error:', error)
      setError('Failed to setup SSE')

      if (enablePollingFallback) {
        setupPolling()
      }
    }
  }

  // Polling fallback
  const setupPolling = () => {
    setUsingPolling(true)
    console.log('[Polling] Starting polling fallback')

    let lastVersion = 0

    const poll = async () => {
      try {
        const response = await fetch(`/api/tastings/${tastingId}`)
        const data = await response.json()

        if (data.version > lastVersion) {
          // Version changed, trigger update
          handleEvent({
            type: 'scoresUpdated',
            tastingId,
            version: data.version
          })
          lastVersion = data.version
        }
      } catch (error) {
        console.error('[Polling] Error:', error)
      }
    }

    // Initial poll
    poll()

    // Set up interval
    pollingIntervalRef.current = setInterval(poll, pollingInterval)
  }

  // Cleanup
  const cleanup = () => {
    if (eventSourceRef.current) {
      console.log('[SSE] Closing connection')
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    if (pollingIntervalRef.current) {
      console.log('[Polling] Stopping polling')
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }

    setConnected(false)
    setUsingPolling(false)
  }

  // Setup on mount, cleanup on unmount
  useEffect(() => {
    setupSSE()
    return cleanup
  }, [tastingId])

  return {
    connected,
    error,
    usingPolling,
    reconnect: setupSSE
  }
}
