import { flavorTagLabel } from '@/lib/flavorTags'
import { FlavorTagIcon } from '@/components/FlavorTagIcon'
import type { BeerTagCount } from '@/components/TastingNotes'

/** The group's flavor tags for a beer, sized by how many picked each */
export function TagCloud({ tags, limit = 10 }: { tags: BeerTagCount[]; limit?: number }) {
  if (tags.length === 0) return null
  const shown = tags.slice(0, limit)
  const max = shown[0].count

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      {shown.map(({ tag, count }) => {
        const weight = count / max
        return (
          <span
            key={tag}
            className="inline-flex items-center gap-[0.25em] font-bold text-primary animate-in fade-in zoom-in-50 duration-500"
            style={{ fontSize: `${1.25 + weight * 1.25}rem`, opacity: 0.7 + weight * 0.3 }}
          >
            <FlavorTagIcon tag={tag} className="h-[0.85em] w-[0.85em] shrink-0" />
            {flavorTagLabel(tag)}
          </span>
        )
      })}
    </div>
  )
}
