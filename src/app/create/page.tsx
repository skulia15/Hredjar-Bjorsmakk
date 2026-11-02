'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AVATARS } from '@/lib/avatars'
import { AvatarPicker } from '@/components/AvatarPicker'

export default function CreateTastingPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATARS[0]?.key ?? '')
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
        body: JSON.stringify({ title, avatar: selectedAvatar })
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

      // Redirect to tasting admin page
      router.push(`/t/${data.id}/admin`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3 sm:p-6 bg-gradient-to-b from-background to-muted">
      <div className="max-w-3xl w-full space-y-6 my-4">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold">Búa til nýja smökkun</h1>
          <p className="mt-1.5 text-muted-foreground">
            Setja upp nýja smökkun og velja þína jólamynd
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-4 sm:p-6 rounded-xl border">
          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-medium">
              Nafn smökkunnar
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Jólabjórsmökkun 2026"
              required
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <AvatarPicker
            selectedAvatar={selectedAvatar}
            onSelect={setSelectedAvatar}
            disabled={loading}
          />

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full px-4 py-3.5 bg-primary text-primary-foreground rounded-md font-semibold text-base hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
