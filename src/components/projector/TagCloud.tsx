import { flavorTagLabel, isCustomTag } from '@/lib/flavorTags'
import { FlavorTagIcon } from '@/components/FlavorTagIcon'
import type { BeerTagCount } from '@/components/TastingNotes'

/**
 * The group's flavor tags for a beer as pills, sized by the share of raters who picked each.
 * Sizing by share (not relative to the top tag) keeps "1 of 10 said smoky" small even when
 * nothing else was picked, and the count says how many it actually was.
 * Custom "Annað" tags are the fun ones: they go first and get a gold, sparkly pill.
 */
export function TagCloud({ tags, raters, limit = 10 }: { tags: BeerTagCount[]; raters: number; limit?: number }) {
  if (tags.length === 0) return null
  // Stable sort keeps the most-picked first within each group
  const ordered = [...tags].sort((a, b) => Number(isCustomTag(b.tag)) - Number(isCustomTag(a.tag)))
  const shown = ordered.slice(0, limit)

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {shown.map(({ tag, count }) => {
        const share = raters > 0 ? Math.min(count / raters, 1) : 0
        const custom = isCustomTag(tag)
        return (
          <span
            key={tag}
            className={`inline-flex items-center gap-[0.35em] rounded-full py-[0.2em] pl-[0.45em] pr-[0.3em] font-bold leading-tight animate-in fade-in zoom-in-50 duration-500 ${
              custom ? 'bg-gold text-ink shadow-[0_0.15em_0_rgba(0,0,0,0.15)]' : 'bg-cranberry/10 text-primary'
            }`}
            style={{ fontSize: `${1 + share * 0.5}rem` }}
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
      {tags.length > limit && (
        <span className="rounded-full bg-cranberry/10 px-[0.6em] py-[0.2em] text-base font-bold text-primary tabular-nums">
          +{tags.length - limit}
        </span>
      )}
    </div>
  )
}
