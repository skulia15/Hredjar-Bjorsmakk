import Image from 'next/image'
import { ArrowDown, ArrowUp, EyeOff } from 'lucide-react'
import { BeerPlaceholder } from '@/components/BeerPlaceholder'
import { CurrentBeerTimer } from '@/components/CurrentBeerTimer'
import type { BeerTagCount } from '@/components/TastingNotes'
import { CountUp } from '@/components/projector/CountUp'
import { ScoreBars } from '@/components/projector/ScoreBars'
import { TagCloud } from '@/components/projector/TagCloud'
import { beerImageSrc } from '@/lib/beerImage'

interface CurrentBeerPanelProps {
  beer: {
    id: string
    name: string
    brewery: string
    imageUrl?: string | null
    containerSize?: number
    containerType?: string
    priceISK?: number
    currentSince?: Date | string | null
  }
  scoresHidden: boolean
  ratedCount: number
  scores: number[]
  average: number | null
  tags: BeerTagCount[]
  showTags: boolean
}

/**
 * The current-beer card while people are still rating: the beer large, its timer and price
 * up top, and the room's flavor tags filling the rest. Scores join in only when the tasting
 * doesn't hide them; once everyone has rated, ScoreRevealPanel takes over.
 */
export function CurrentBeerPanel({ beer, scoresHidden, ratedCount, scores, average, tags, showTags }: CurrentBeerPanelProps) {
  const showScores = !scoresHidden && average !== null && scores.length > 0
  const showTagCloud = showTags && tags.length > 0

  return (
    // On a short projector (max-height:1000px) the header tightens up so the tags get the height
    <div key={beer.id} className="w-full flex-1 min-h-0 flex flex-col gap-5 2xl:gap-7 [@media(max-height:1000px)]:gap-3 text-left animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-start gap-6 2xl:gap-8">
        {/* Smaller once the score bars need the height. Sized by the screen's height, which runs
            out first: a 1600x900 projector gets the big-screen widths but not the height */}
        <div
          className={`beer-bob shrink-0 rounded-full bg-gold-soft flex items-center justify-center overflow-hidden transition-[width,height] duration-500 ${
            showScores ? 'size-[clamp(5rem,13vh,9rem)]' : 'size-[clamp(6rem,19vh,12rem)]'
          }`}
        >
          {beer.imageUrl ? (
            <Image src={beerImageSrc(beer.imageUrl)} alt={beer.name} width={240} height={240} className="object-contain max-h-[82%] w-auto" />
          ) : (
            <BeerPlaceholder className="h-3/4 w-auto text-[#7A3B12]" />
          )}
        </div>

        <div className="min-w-0 flex-1 flex flex-col gap-2 2xl:gap-3 [@media(max-height:1000px)]:gap-1.5">
          {/* Side by side; the timer drops under the label only on a card too narrow for both */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-base 2xl:text-xl font-extrabold tracking-[0.12em] 2xl:tracking-[0.18em] uppercase text-cranberry">Núverandi bjór</span>
            {beer.currentSince && (
              // Big enough to read from the back of the room
              <span className="inline-flex items-center rounded-full bg-ink text-cream px-4 py-1 [&_svg]:text-gold">
                <CurrentBeerTimer currentSince={beer.currentSince} colorCoded={false} size="xl" />
              </span>
            )}
          </div>
          {/* Christmas beers have long names; three lines beat an ellipsis */}
          <h2 className="text-[length:clamp(1.6rem,4.6vh,2.75rem)] leading-[1.02] tracking-tight line-clamp-3">{beer.name}</h2>
          <p className="text-xl 2xl:text-2xl [@media(max-height:1000px)]:text-lg text-muted-foreground truncate">
            {beer.brewery}
            {beer.containerSize && beer.containerType && ` · ${beer.containerSize} ml ${beer.containerType}`}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {beer.priceISK != null && (
              // What one can or bottle costs, the way people buy it
              <span className="inline-flex items-baseline gap-1.5 rounded-full bg-holly px-4 py-1 text-cream">
                <span className="text-2xl 2xl:text-3xl [@media(max-height:1000px)]:text-xl font-extrabold tabular-nums">{Math.round(beer.priceISK).toLocaleString('is-IS')} kr</span>
                {beer.containerType && <span className="text-base 2xl:text-lg font-semibold">/ {beer.containerType.toLowerCase()}</span>}
              </span>
            )}
            {scoresHidden && (
              // Framvinda shows "5 / 8 búin" right beside this, so the chip only says why scores are missing
              <span className="inline-flex items-center gap-2.5 rounded-full bg-cream-dim px-4 py-1.5 [@media(max-height:1000px)]:py-1 text-lg 2xl:text-xl [@media(max-height:1000px)]:text-base font-bold text-ink-soft">
                <EyeOff className="h-6 w-6 shrink-0" aria-hidden />
                Einkunnir faldar
              </span>
            )}
          </div>
        </div>
      </div>

      {showScores && (
        <div className="w-full grid grid-cols-[auto_minmax(0,1fr)] gap-10 items-end animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex flex-col gap-1">
            <span className="text-xl font-semibold text-muted-foreground">Meðaleinkunn</span>
            <span className="text-[length:min(6rem,5.5vw)] whitespace-nowrap leading-[0.9] font-extrabold text-cranberry tabular-nums">
              <CountUp value={average} durationMs={600} />
            </span>
            <span className="mt-2 flex items-center gap-4 text-lg font-semibold text-muted-foreground tabular-nums whitespace-nowrap">
              <span>{scores.length} einkunn{scores.length !== 1 ? 'ir' : ''}</span>
              <span className="inline-flex items-center gap-1" title="Hæsta einkunn">
                <ArrowUp className="h-5 w-5 text-holly" aria-label="Hæsta" />{Math.max(...scores).toFixed(1)}
              </span>
              <span className="inline-flex items-center gap-1" title="Lægsta einkunn">
                <ArrowDown className="h-5 w-5 text-cranberry" aria-label="Lægsta" />{Math.min(...scores).toFixed(1)}
              </span>
            </span>
          </div>
          <ScoreBars key={`bars-${beer.id}`} scores={scores} />
        </div>
      )}

      {showTagCloud ? (
        // Takes whatever height is left, centred, and never spills out of the card
        <div
          aria-label="Bragðlýsingar"
          className={`flex-1 min-h-0 overflow-hidden flex flex-col [justify-content:safe_center] rounded-3xl bg-cream-dim px-5 ${
            // The largest size; the cloud shrinks from here until every tag fits
            showScores ? 'py-3 [--tag-scale:1.4]' : 'py-4 [--tag-scale:1.95]'
          }`}
        >
          {/* Every tag, shrunk only as far as the space needs */}
          <TagCloud tags={tags} raters={ratedCount} fit />
        </div>
      ) : !showScores && ratedCount === 0 ? (
        <p className="flex-1 flex items-center justify-center text-3xl font-semibold text-muted-foreground">Engar einkunnir ennþá</p>
      ) : null}
    </div>
  )
}
