'use client'

import { useState } from 'react'
import { BellOff, BellRing, Share, X } from 'lucide-react'
import { usePushNudges } from '@/hooks/usePushNudges'

const DISMISSED_KEY = 'push_nudge_hint_dismissed'

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Offers "Drífa sig!" as a notification, so it reaches a phone that's locked. On iPhone that
 * only works from the home-screen app, so Safari gets the steps to add it there instead.
 */
export function PushNudgeToggle() {
  const { state, busy, enable, disable } = usePushNudges()
  const [dismissed, setDismissed] = useState(readDismissed)

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // Hidden for this visit only
    }
  }

  if (state === 'checking' || state === 'unsupported') return null

  if (state === 'on') {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-pine-light px-4 py-2.5 text-sm text-cream">
        <BellRing className="h-4 w-4 shrink-0 text-gold" aria-hidden />
        <span className="flex-1">„Drífa sig!“ kemur líka í læstan síma</span>
        <button
          type="button"
          onClick={disable}
          disabled={busy}
          className="min-h-10 px-2 font-semibold text-cream/80 underline underline-offset-2 disabled:opacity-50"
        >
          Slökkva
        </button>
      </div>
    )
  }

  if (state === 'denied') {
    return (
      <div className="flex items-start gap-2 rounded-2xl bg-pine-light px-4 py-3 text-sm text-cream/80">
        <BellOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>Tilkynningar eru lokaðar. Leyfðu þær í stillingum vafrans til að fá „Drífa sig!“ í læstan síma.</span>
      </div>
    )
  }

  if (dismissed) return null

  return (
    <div className="relative rounded-2xl bg-pine-light p-4 pr-11 text-sm text-cream">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fela"
        className="absolute right-1.5 top-1.5 flex h-10 w-10 items-center justify-center rounded-full text-cream/70"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
      <p className="font-semibold">Fáðu „Drífa sig!“ þó síminn sé læstur</p>
      {state === 'needs-install' ? (
        <p className="mt-1 text-cream/80">
          Ýttu á <Share className="inline h-4 w-4 -mt-0.5" aria-label="Deila" /> og svo „Bæta á heimaskjá“.
          Opnaðu appið þaðan og kveiktu á tilkynningum.
        </p>
      ) : (
        <button
          type="button"
          onClick={enable}
          disabled={busy}
          className="mt-2.5 min-h-11 w-full rounded-full bg-cream font-extrabold text-ink disabled:opacity-60"
        >
          Kveikja á tilkynningum
        </button>
      )}
    </div>
  )
}
