import Image from 'next/image'
import { ArrowDown, ArrowLeft, ArrowUp } from 'lucide-react'
import { BeerPlaceholder } from '@/components/BeerPlaceholder'
import type { BeerTagCount } from '@/components/TastingNotes'
import { ScoreBars } from '@/components/projector/ScoreBars'
import { TagCloud } from '@/components/projector/TagCloud'
import { beerImageSrc } from '@/lib/beerImage'

export interface SelectedBeerRating {
  participantId: string
  userName: string
  avatar?: string | null
  score: number
}

interface SelectedBeerPanelProps {
  beer: {
    name: string
    brewery: string
    imageUrl?: string | null
    containerSize?: number
    containerType?: string
  }
  rank: number
  average: number
  // null while the ratings are still loading
  ratings: SelectedBeerRating[] | null
  tags: BeerTagCount[]
  showTags: boolean
  backLabel: string
  onBack: () => void
}

/**
 * A finished beer picked from the leaderboard, shown in the middle card in place of the
 * current beer: where it landed, its average and how the scores spread.
 */
export function SelectedBeerPanel({ beer, rank, average, ratings, tags, showTags, backLabel, onBack }: SelectedBeerPanelProps) {
  const scores = ratings?.map(r => r.score) ?? []

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col gap-4 text-left animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xl font-extrabold tracking-[0.18em] uppercase text-cranberry">{rank}. sæti</span>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 min-h-12 rounded-full bg-cranberry text-white text-lg font-extrabold shadow-sm hover:brightness-110"
        >
          <ArrowLeft className="h-5 w-5" />
          {backLabel}
        </button>
      </div>

      <div className="flex items-center gap-6">
        <div className="w-24 h-24 2xl:w-32 2xl:h-32 shrink-0 rounded-full bg-gold-soft flex items-center justify-center overflow-hidden">
          {beer.imageUrl ? (
            <Image src={beerImageSrc(beer.imageUrl)} alt={beer.name} width={160} height={160} className="object-contain max-h-[80%] w-auto" />
          ) : (
            <BeerPlaceholder className="h-3/4 w-auto text-[#7A3B12]" />
          )}
        </div>
        <div className="min-w-0 flex-1 flex flex-col gap-1.5">
          <h2 className="text-4xl 2xl:text-5xl leading-none line-clamp-2">{beer.name}</h2>
          <p className="text-xl 2xl:text-2xl text-muted-foreground truncate">
            {beer.brewery}
            {beer.containerSize && beer.containerType && ` · ${beer.containerSize} ml ${beer.containerType}`}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end">
          <span className="text-lg font-semibold text-muted-foreground">Meðaleinkunn</span>
          <span className="text-6xl 2xl:text-7xl leading-[0.9] font-extrabold text-cranberry tabular-nums">{average.toFixed(2)}</span>
          {scores.length > 0 && (
            <span className="mt-1 flex gap-4 text-lg font-semibold text-muted-foreground tabular-nums whitespace-nowrap">
              <span className="inline-flex items-center gap-1" title="Hæsta einkunn">
                <ArrowUp className="h-5 w-5 text-holly" aria-label="Hæsta" />
                {Math.max(...scores).toFixed(1)}
              </span>
              <span className="inline-flex items-center gap-1" title="Lægsta einkunn">
                <ArrowDown className="h-5 w-5 text-cranberry" aria-label="Lægsta" />
                {Math.min(...scores).toFixed(1)}
              </span>
            </span>
          )}
        </div>
      </div>

      {ratings === null ? (
        <p className="flex-1 flex items-center justify-center text-2xl text-muted-foreground">Sæki einkunnir…</p>
      ) : (
        <>
          {/* No room for who gave what in the middle card: the bars show the spread */}
          <div className="flex-1 min-h-[8rem]">
            <ScoreBars size="lg" scores={scores} />
          </div>
          {showTags && tags.length > 0 && (
            <div className="w-full" aria-label="Bragðlýsingar">
              <TagCloud tags={tags} raters={scores.length} limit={6} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
