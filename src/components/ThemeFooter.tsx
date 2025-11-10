'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type UiStyle = 'default' | 'neo' | 'christmas'

export function ThemeFooter() {
  const pathname = usePathname()
  const [style, setStyle] = useState<UiStyle>('default')
  const [mounted, setMounted] = useState(false)

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
    const body = document.body
    body.classList.remove('neo-brutalist')
    body.classList.remove('christmas')
    if (next === 'neo') body.classList.add('neo-brutalist')
    if (next === 'christmas') body.classList.add('christmas')
  }

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as UiStyle
    setStyle(next)
    applyStyle(next)
    try { localStorage.setItem('uiStyle', next) } catch {}
  }

  // Hide footer on projector routes
  if (pathname?.startsWith('/projector')) {
    return null
  }

  return (
    <footer className="w-full border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between text-xs">
        <span className="opacity-80">Theme</span>
        <div className="flex items-center gap-2">
          <label htmlFor="theme-select" className="sr-only">Theme</label>
          <select
            id="theme-select"
            value={mounted ? style : 'default'}
            onChange={onChange}
            className="border bg-card text-foreground px-2 py-1 rounded-md shadow-sm min-w-[9rem]"
          >
            <option value="default">Default</option>
            <option value="neo">Neo Brutalist</option>
            <option value="christmas">Christmas</option>
          </select>
        </div>
      </div>
    </footer>
  )
}


