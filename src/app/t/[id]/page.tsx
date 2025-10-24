'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinTastingPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tastingTitle, setTastingTitle] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const checkSessionAndJoin = async () => {
      try {
        // Check for existing session
        const sessionResponse = await fetch('/api/session')
        const sessionData = await sessionResponse.json()

        if (sessionData.hasSession && sessionData.name) {
          // User has a session, auto-join with their stored name
          setName(sessionData.name)

          // Auto-join the tasting
          const joinResponse = await fetch(`/api/tastings/${params.id}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: sessionData.name })
          })

          if (joinResponse.ok) {
            const joinData = await joinResponse.json()

            // Store participant info in localStorage
            localStorage.setItem(`participant_${params.id}`, JSON.stringify({
              participantId: joinData.participantId,
              userId: joinData.userId,
              rejoinToken: joinData.rejoinToken,
              code: joinData.code
            }))

            // Redirect based on role
            if (joinData.isLeader) {
              router.push(`/t/${params.id}/admin`)
            } else {
              router.push(`/t/${params.id}/rate`)
            }
            return
          }
        }
      } catch (err) {
        console.error('Error checking session:', err)
      }

      // No session or auto-join failed, show the form
      setCheckingSession(false)
    }

    // Fetch tasting details
    fetch(`/api/tastings/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.title) {
          setTastingTitle(data.title)
        }
        // Redirect to scores if tasting is closed
        if (data.status === 'closed') {
          router.push(`/t/${params.id}/scores`)
        } else {
          // Only check session if tasting is not closed
          checkSessionAndJoin()
        }
      })
      .catch(() => {
        setError('Tasting not found')
        setCheckingSession(false)
      })
  }, [params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/tastings/${params.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to join tasting')
      }

      const data = await response.json()

      // Store participant info in localStorage for rating submission
      localStorage.setItem(`participant_${params.id}`, JSON.stringify({
        participantId: data.participantId,
        userId: data.userId,
        rejoinToken: data.rejoinToken,
        code: data.code
      }))

      // Redirect based on role
      if (data.isLeader) {
        router.push(`/t/${params.id}/admin`)
      } else {
        router.push(`/t/${params.id}/rate`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍺</div>
          <p className="text-muted-foreground">Checking session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">🍺</h1>
          <h2 className="text-2xl font-bold">{tastingTitle || 'Taka þátt í smökkunni'}</h2>
          <p className="text-muted-foreground">
            Sláðu inn nafn til að taka þátt í smökkunni
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Þitt nafn
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sláðu inn nafn"
              required
              autoFocus
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground">
              Ef þú hefur takið þátt áður, notaðu sama nafn
            </p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Hleypir inn...' : 'Taka þátt'}
          </button>
        </form>
      </div>
    </div>
  )
}
