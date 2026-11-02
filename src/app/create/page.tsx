'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { AVATARS, avatarSrc } from '@/lib/avatars'

export default function CreateTastingPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATARS[0]?.key ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const chosenObj = AVATARS.find(a => a.key === selectedAvatar)

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

          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Veldu þér jólamynd
            </label>

            {chosenObj && (
              <div className="flex flex-col items-center gap-2 pb-4 border-b">
                <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full overflow-hidden ring-4 ring-amber-500 shadow-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarSrc(chosenObj)}
                    alt={chosenObj.name}
                    className="w-full h-full object-cover select-none"
                  />
                </div>
                <div className="text-base sm:text-lg font-bold text-foreground">{chosenObj.name}</div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[42vh] overflow-y-auto p-1">
              {AVATARS.map(avatar => {
                const isSelected = selectedAvatar === avatar.key
                return (
                  <button
                    key={avatar.key}
                    type="button"
                    disabled={loading}
                    onClick={() => setSelectedAvatar(avatar.key)}
                    className={`group flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/50 scale-[1.02]'
                        : 'border-border hover:border-amber-500/50 hover:bg-accent/40'
                    }`}
                  >
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarSrc(avatar)}
                        alt={avatar.name}
                        className="w-full h-full rounded-full object-cover select-none"
                      />
                      {isSelected && (
                        <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center shadow">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-medium leading-tight line-clamp-2">
                      {avatar.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

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
            {loading
              ? 'Bý til...'
              : chosenObj
                ? `Búa til smökkun sem ${chosenObj.name}`
                : 'Búa til smökkun'}
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
