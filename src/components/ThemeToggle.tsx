'use client'

import { useEffect, useState } from 'react'

type UiStyle = 'neo' | 'default' | 'christmas'

export function ThemeToggle() {
  const [style, setStyle] = useState<UiStyle>('neo')
  const [mounted, setMounted] = useState(false)

  // Initialize from localStorage or current DOM state
  useEffect(() => {
    const stored = (typeof window !== 'undefined' && localStorage.getItem('uiStyle')) as UiStyle | null
    const body = typeof document !== 'undefined' ? document.body : null
    const hasNeo = !!body?.classList.contains('neo-brutalist')
    const hasXmas = !!body?.classList.contains('christmas')

    const initial: UiStyle = stored ?? (hasXmas ? 'christmas' : hasNeo ? 'neo' : 'default')
    setStyle(initial)
    applyStyle(initial)
    setMounted(true)
  }, [])

  const applyStyle = (next: UiStyle) => {
    if (typeof document === 'undefined') return
    const body = document.body
    // Clear both theme classes first
    body.classList.remove('neo-brutalist')
    body.classList.remove('christmas')
    if (next === 'neo') body.classList.add('neo-brutalist')
    if (next === 'christmas') body.classList.add('christmas')
  }

  const toggle = () => {
    const next: UiStyle = style === 'default' ? 'neo' : style === 'neo' ? 'christmas' : 'default'
    setStyle(next)
    applyStyle(next)
    try {
      localStorage.setItem('uiStyle', next)
    } catch {}
  }

  // Avoid flash of wrong label before mount
  const label = !mounted
    ? 'Theme'
    : style === 'neo'
      ? 'Neo Brutalist'
      : style === 'christmas'
        ? 'Christmas'
        : 'Default'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch Theme"
      className="fixed bottom-4 left-4 md:bottom-6 z-40 border-3 border-black bg-secondary text-secondary-foreground shadow-neo-sm px-3 py-1.5 text-xs font-bold uppercase tracking-wide hover:-translate-y-px hover:-translate-x-px hover:shadow-neo-lg active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
    >
      {label}
    </button>
  )
}


