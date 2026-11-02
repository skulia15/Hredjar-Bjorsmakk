import { MessageSquareQuote } from 'lucide-react'
import { flavorTagLabel } from '@/lib/flavorTags'
import { FlavorTagIcon } from '@/components/FlavorTagIcon'
import { ParticipantAvatar } from '@/components/ChristmasAvatar'
import { StatCard } from '@/components/StatCard'

export interface BeerTagCount {
  tag: string
  count: number
}

interface BeerNotes {
  beerId: string
  name: string
  brewery: string
  tags: BeerTagCount[]
  notes: Array<{ participantId: string; userName: string; avatar?: string | null; note: string }>
}

export function TagChips({ tags, limit }: { tags: BeerTagCount[]; limit?: number }) {
  if (tags.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.slice(0, limit).map(({ tag, count }) => (
        <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
          <FlavorTagIcon tag={tag} className="h-[1.1em] w-[1.1em] shrink-0" />
          {flavorTagLabel(tag)} <span className="font-semibold">{count}</span>
        </span>
      ))}
    </div>
  )
}

/** Flavor tags and free-text notes per finished beer */
export function TastingNotes({ beers }: { beers: BeerNotes[] }) {
  const withNotes = beers.filter(b => b.tags.length > 0 || b.notes.length > 0)
  if (withNotes.length === 0) return null

  return (
    <StatCard tone="section" className="mt-8" icon={MessageSquareQuote} title="Bragðlýsingar" description="Hvað fólki fannst um hvern bjór">
      <div className="space-y-3">
        {withNotes.map(beer => (
          <div key={beer.beerId} className="bg-card p-4 rounded-lg border space-y-3">
            <div>
              <h3 className="font-bold">{beer.name}</h3>
              <p className="text-sm text-muted-foreground">{beer.brewery}</p>
            </div>
            <TagChips tags={beer.tags} />
            {beer.notes.length > 0 && (
              <ul className="space-y-2">
                {beer.notes.map(n => (
                  <li key={n.participantId} className="flex items-center gap-2.5 text-sm">
                    <ParticipantAvatar avatar={n.avatar} seed={n.participantId} className="h-9 w-9 shrink-0" />
                    <span>
                      <span className="font-medium">{n.userName}:</span>{' '}
                      <span className="text-muted-foreground whitespace-pre-line break-words">{n.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </StatCard>
  )
}
