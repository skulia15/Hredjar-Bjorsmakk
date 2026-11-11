'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { flavorTagLabel, isCustomTag } from '@/lib/flavorTags'
import { FlavorTagIcon } from '@/components/FlavorTagIcon'
import type { BeerTagCount } from '@/components/TastingNotes'

// The smallest the pills shrink to with `fit`, as a share of their full size
const MIN_FIT = 0.3

/**
 * The tags in display order: those already showing keep their places, new ones join the end
 * (in the order given, most-picked first), and custom tags stay ahead of the fixed ones.
 */
function stableOrder(previous: string[], current: string[]): string[] {
  const present = new Set(current)
  const kept = previous.filter(tag => present.has(tag))
  const keptSet = new Set(kept)
  const merged = [...kept, ...current.filter(tag => !keptSet.has(tag))]
  return [...merged.filter(isCustomTag), ...merged.filter(tag => !isCustomTag(tag))]
}

/**
 * The group's flavor tags for a beer as pills, sized by the share of raters who picked each.
 * Sizing by share (not relative to the top tag) keeps "1 of 10 said smoky" small even when
 * nothing else was picked, and the count says how many it actually was.
 * Custom "Annað" tags are the fun ones: they go first and get a gold, sparkly pill.
 *
 * With `fit`, every tag shows: the pills shrink, keeping their relative sizes, until all of them
 * fit whole in the parent's height. Without it, `limit` caps the pills and "+N" counts the rest.
 */
export function TagCloud({ tags, raters, limit = 10, align = 'center', fit = false }: {
  tags: BeerTagCount[]
  raters: number
  limit?: number
  align?: 'center' | 'start'
  fit?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  // What the last fit was worked out for; the same box and the same tags keep the same size
  const fittedFor = useRef('')
  const fitKey = `${raters}|${tags.map(t => `${t.tag}:${t.count}`).join(',')}`

  // Finds the largest size (as --fit, 1 = full) at which the whole cloud fits its parent, in one
  // synchronous pass: set, measure, repeat. Done on the DOM rather than in state, so a header
  // still animating its size can't leave a stale, too-small answer behind
  useLayoutEffect(() => {
    const wrapper = ref.current
    const box = wrapper?.parentElement
    if (!fit || !wrapper || !box) return
    const fitNow = (force = false) => {
      // Only re-fit when the box or the tags changed: refitting on every poll nudged the size about
      const key = `${box.clientWidth}x${box.clientHeight}|${fitKey}`
      if (!force && key === fittedFor.current) return
      fittedFor.current = key
      const style = getComputedStyle(box)
      // 2px spare so sub-pixel rounding can't clip the last row
      const available = box.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - 2
      // offsetHeight ignores the pills' zoom-in animation, which getBoundingClientRect would not
      const fits = (scale: number) => {
        wrapper.style.setProperty('--fit', String(scale))
        return wrapper.offsetHeight <= available
      }
      if (fits(1)) return
      let low = MIN_FIT
      let high = 1
      for (let i = 0; i < 8; i++) {
        const mid = (low + high) / 2
        if (fits(mid)) low = mid
        else high = mid
      }
      wrapper.style.setProperty('--fit', String(low))
    }
    fitNow()
    // The display font arriving after the first measure changes every pill's width
    let cancelled = false
    document.fonts?.ready.then(() => !cancelled && fitNow(true))
    // The box resizing re-fits; so does the window, since rem and vw-based pill sizes change with
    // the screen even when the box doesn't. The cloud itself isn't observed: its own resizing
    // while fitting fed straight back into another fit
    const observer = new ResizeObserver(() => fitNow())
    observer.observe(box)
    const onResize = () => fitNow(true)
    window.addEventListener('resize', onResize)
    return () => {
      cancelled = true
      observer.disconnect()
      window.removeEventListener('resize', onResize)
    }
  })

  // Pills keep the place they first appeared in. Re-sorting by count on every poll moved them
  // around, and a moved pill is re-inserted, which replays its zoom-in: the cloud jumped and
  // blinked whenever anyone tapped a tag. Size and the count badge still show what's popular
  const keys = tags.map(t => t.tag)
  const [order, setOrder] = useState(() => stableOrder([], keys))
  const nextOrder = stableOrder(order, keys)
  if (nextOrder.join('\n') !== order.join('\n')) setOrder(nextOrder)

  if (tags.length === 0) return null
  const byTag = new Map(tags.map(t => [t.tag, t]))
  const ordered = nextOrder.map(tag => byTag.get(tag)!)
  const shown = fit ? ordered : ordered.slice(0, limit)
  const hidden = tags.length - shown.length

  return (
    <div ref={ref} className={`relative flex flex-wrap items-center gap-2 ${align === 'start' ? 'justify-start' : 'justify-center'}`}>
      {shown.map(({ tag, count }) => {
        const share = raters > 0 ? Math.min(count / raters, 1) : 0
        const custom = isCustomTag(tag)
        return (
          <span
            key={tag}
            // transition-none: duration-500 (for the entry animation) also gave every property a
            // 0.5s transition, so a resize to fit was still animating when it was measured and
            // the fit flipped between tiny and full size several times a second
            className={`inline-flex items-center gap-[0.35em] rounded-full py-[0.2em] pl-[0.45em] pr-[0.3em] font-bold leading-tight animate-in fade-in zoom-in-50 duration-500 transition-none ${
              custom ? 'bg-gold text-ink shadow-[0_0.15em_0_rgba(0,0,0,0.15)]' : 'bg-cranberry/10 text-primary'
            }`}
            // --tag-scale on a parent enlarges the pills, for the full-width reveal; --fit shrinks them into the space
            style={{ fontSize: `calc(${1 + share * 0.5}rem * var(--tag-scale, 1) * var(--fit, 1))` }}
          >
            <FlavorTagIcon tag={tag} className="h-[1em] w-[1em] shrink-0" />
            {custom ? <span className="italic">{flavorTagLabel(tag)}</span> : flavorTagLabel(tag)}
            <span className={`min-w-[1.6em] rounded-full px-[0.45em] text-center text-[0.65em] tabular-nums ${
              custom ? 'bg-ink text-gold' : 'bg-cranberry text-cream'
            }`}>
              {count}
            </span>
          </span>
        )
      })}
      {hidden > 0 && (
        <span className="rounded-full bg-cranberry/10 px-[0.6em] py-[0.2em] font-bold text-primary tabular-nums" style={{ fontSize: 'calc(1rem * var(--tag-scale, 1))' }}>
          +{hidden}
        </span>
      )}
    </div>
  )
}
