'use client'

import { useState } from 'react'
import { DISPLAY_NAME_MAX_LENGTH } from '@/lib/displayName'

/**
 * Edits the signed-in user's display name. Used before a first join and from the account menu
 */
export function NicknameForm({
  initialName,
  submitLabel,
  onSaved,
  onCancel,
}: {
  initialName: string
  submitLabel: string
  onSaved: (name: string) => void
  onCancel?: () => void
}) {
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setSaving(true)
    setError('')
    try {
      // Unchanged name: skip the request, the caller still moves on
      if (trimmed !== initialName) {
        const response = await fetch('/api/session', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: trimmed }),
        })
        if (!response.ok) throw new Error('save failed')
      }
      onSaved(trimmed)
    } catch {
      setError('Tókst ekki að vista nafnið, reyndu aftur')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nickname" className="block text-sm font-medium mb-1">
          Gælunafn
        </label>
        <input
          id="nickname"
          type="text"
          required
          autoFocus
          autoComplete="nickname"
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full min-h-12 px-4 py-2 border-0 rounded-2xl bg-cream-dim text-ink text-[1.0625rem] font-semibold focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <p className="mt-1 text-xs text-muted-foreground">Birtist öðrum á stigatöflunni og skjávarpanum</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-h-12 px-4 py-3 border rounded-2xl font-semibold hover:bg-accent transition-colors"
          >
            Hætta við
          </button>
        )}
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="flex-1 min-h-12 px-4 py-3 bg-primary text-primary-foreground rounded-2xl font-extrabold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? 'Vista...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
