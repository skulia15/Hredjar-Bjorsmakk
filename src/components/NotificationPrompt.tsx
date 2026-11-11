'use client'

import { useEffect, useState } from 'react'
import { BellOff, BellRing, Share } from 'lucide-react'
import { usePushNudges } from '@/hooks/usePushNudges'

/**
 * Asks for notifications on entering the rate page, so "Drífa sig!" reaches a locked phone.
 * Shows nothing once they're allowed. The browser's own prompt only opens from a tap, so this
 * asks first and the button opens it. On iPhone Safari, where push needs the home-screen app,
 * it gives the steps to add it instead. "Ekki núna" hides it until the page is opened again.
 */
export function NotificationPrompt() {
  const { state, busy, enable } = usePushNudges()
  const [closed, setClosed] = useState(false)
  const open = !closed && (state === 'off' || state === 'denied' || state === 'needs-install')

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setClosed(true)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (!open) return null

  const allow = async () => {
    await enable()
    // Whatever they picked in the browser's prompt, it's answered
    setClosed(true)
  }

  const primary = 'w-full min-h-12 rounded-2xl bg-gold text-ink font-extrabold disabled:opacity-60'
  const secondary = 'w-full min-h-11 rounded-2xl font-semibold text-ink-soft'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-prompt-title"
        className="w-full max-w-sm space-y-4 rounded-3xl bg-cream p-6 text-center text-ink"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft">
          {state === 'denied'
            ? <BellOff className="h-7 w-7 text-ink" aria-hidden />
            : <BellRing className="h-7 w-7 text-ink" aria-hidden />}
        </div>

        {state === 'off' && (
          <>
            <h2 id="notification-prompt-title" className="text-xl font-extrabold">Leyfa tilkynningar?</h2>
            <p className="text-ink-soft">Þá færðu „Drífa sig!“ líka þegar síminn er læstur.</p>
            <div className="space-y-1.5">
              <button type="button" onClick={allow} disabled={busy} autoFocus className={primary}>
                Leyfa tilkynningar
              </button>
              <button type="button" onClick={() => setClosed(true)} className={secondary}>
                Ekki núna
              </button>
            </div>
          </>
        )}

        {state === 'needs-install' && (
          <>
            <h2 id="notification-prompt-title" className="text-xl font-extrabold">Fáðu „Drífa sig!“ í læstan síma</h2>
            <p className="text-ink-soft">
              Ýttu á <Share className="inline h-4 w-4 -mt-0.5" aria-label="Deila" /> og svo „Bæta á heimaskjá“.
              Opnaðu appið þaðan og leyfðu tilkynningar.
            </p>
            <button type="button" onClick={() => setClosed(true)} autoFocus className={primary}>
              Skilið
            </button>
          </>
        )}

        {state === 'denied' && (
          <>
            <h2 id="notification-prompt-title" className="text-xl font-extrabold">Tilkynningar eru lokaðar</h2>
            <p className="text-ink-soft">
              Leyfðu tilkynningar fyrir þessa síðu í stillingum vafrans til að fá „Drífa sig!“ þegar síminn er læstur.
            </p>
            <button type="button" onClick={() => setClosed(true)} autoFocus className={primary}>
              Skilið
            </button>
          </>
        )}
      </div>
    </div>
  )
}
