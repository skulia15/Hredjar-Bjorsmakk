'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateTastingPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/tastings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create tasting')
      }

      const data = await response.json()

      if (data.participant) {
        localStorage.setItem(`participant_${data.id}`, JSON.stringify({
          participantId: data.participant.id,
          userId: data.participant.userId,
          code: data.participant.code
        }))
      }

      // Let the creator pick their avatar first, then continue to the tasting admin page
      router.push(`/t/${data.id}?pick=1&next=admin`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Búa til nýja smökkun</h1>
          <p className="mt-2 text-muted-foreground">
            Setja upp nýja smökkun
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium">
              Nafn smökkunnar
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Jólabjórsmökkun 2014"
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
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
            {loading ? 'Bý til...' : 'Búa til smökkun'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← aftur á forsíðu
          </button>
        </div>
      </div>
    </div>
  )
}
