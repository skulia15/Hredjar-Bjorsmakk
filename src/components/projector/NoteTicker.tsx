'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ParticipantAvatar } from '@/components/ChristmasAvatar'

export interface TickerNote {
  key: string
  avatar?: string | null
  note: string
}

const PAGE_MS = 8000

/**
 * Rating notes, stacked so a few read at once from across the room. Shows as many as fit whole
 * in the height it's given; when there are more, it pages through them all, newest first.
 * `cream` is for the cream reveal card, where cream notes would vanish into the card.
 */
export function NoteStack({ notes, tone = 'dark' }: { notes: TickerNote[]; tone?: 'dark' | 'cream' }) {
  const listRef = useRef<HTMLUListElement>(null)
  const [start, setStart] = useState(0)
  // How many whole notes fit, measured from the list itself
  const [perPage, setPerPage] = useState(notes.length)

  const count = notes.length
  const first = count > 0 ? start % count : 0
  // From the current page on, wrapping round, so the last page is topped up with the first notes
  const ordered = [...notes.slice(first), ...notes.slice(0, first)]

  // Hide the notes that would be cut off, and remember how many fit for paging
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const measure = () => {
      const items = [...list.children] as HTMLElement[]
      items.forEach(item => { item.style.display = '' })
      let fitting = 0
      for (const item of items) {
        if (item.offsetTop + item.offsetHeight > list.clientHeight + 1) break
        fitting++
      }
      // Always show one, clamped, rather than none
      const shown = Math.max(1, fitting)
      items.forEach((item, i) => { item.style.display = i < shown ? '' : 'none' })
      setPerPage(previous => (previous === shown ? previous : shown))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => observer.disconnect()
  })

  // Page through the rest when they don't all fit
  useEffect(() => {
    if (count <= perPage) return
    const timer = setInterval(() => setStart(s => s + perPage), PAGE_MS)
    return () => clearInterval(timer)
  }, [count, perPage])

  if (count === 0) return null
  const paging = count > perPage

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2">
      {/* relative: the notes' offsetTop is measured from the list, not the page grid */}
      <ul ref={listRef} className="relative flex-1 min-h-0 overflow-hidden flex flex-col gap-3">
        {ordered.map(note => (
          <li
            // By author and page: a new page fades in, but a new note arriving doesn't replay the others
            key={`${note.key}-${paging ? first : 0}`}
            // Sized off the screen, so a big projector gets big notes
            className={`shrink-0 flex items-center gap-4 rounded-2xl rounded-bl-sm px-4 py-3 text-ink animate-in fade-in slide-in-from-bottom-2 duration-500 ${
              tone === 'cream' ? 'bg-white/80 border-2 border-cream-line' : 'bg-cream'
            }`}
          >
            <ParticipantAvatar
              avatar={note.avatar}
              seed={note.key}
              className="w-[clamp(3.5rem,min(4.6vw,8.5vh),6.5rem)] h-[clamp(3.5rem,min(4.6vw,8.5vh),6.5rem)] shrink-0 shadow-sm"
            />
            {/* Anonymous on purpose: guessing who wrote what is half the fun */}
            <blockquote className="min-w-0 flex-1 text-[length:clamp(1.2rem,min(1.45vw,2.6vh),2.25rem)] font-semibold leading-snug line-clamp-3">„{note.note}“</blockquote>
          </li>
        ))}
      </ul>
      {paging && (
        <span className={`shrink-0 text-right text-lg font-semibold tabular-nums ${tone === 'cream' ? 'text-muted-foreground' : 'text-mint'}`}>
          {first + 1}–{Math.min(first + perPage, count)} af {count}
        </span>
      )}
    </div>
  )
}
