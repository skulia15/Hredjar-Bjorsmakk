import Image from 'next/image'
import { ArrowDown, ArrowUp, Brain, PartyPopper, Sparkles } from 'lucide-react'
import { BeerPlaceholder } from '@/components/BeerPlaceholder'
import { ParticipantAvatar } from '@/components/ChristmasAvatar'
import type { BeerTagCount } from '@/components/TastingNotes'
import { CountUp } from '@/components/projector/CountUp'
import { ScoreBars } from '@/components/projector/ScoreBars'
import { TagCloud } from '@/components/projector/TagCloud'
import type { TickerNote } from '@/components/projector/NoteTicker'
import { BeerAwardsStrip } from '@/components/projector/BeerAwardsStrip'
import { beerImageSrc } from '@/lib/beerImage'
import { formatAbv } from '@/lib/utils'
import type { BeerAward } from '@/lib/beerAwards'

interface ScoreRevealPanelProps {
  beer: {
    name: string
    brewery: string
    abv?: number | null
    imageUrl?: string | null
    containerSize?: number
    containerType?: string
    priceISK?: number
  }
  scores: number[]
  average: number
  bestGuess: { userName: string; guess: number } | null
  tags: BeerTagCount[]
  raters: number
  notes: TickerNote[]
  // The hidden scores came out just now, not on a reload: count up and celebrate
  justRevealed: boolean
  showTags: boolean
  /** This beer's own awards (fastest, slowest, most generous, strictest, Útlaginn) */
  awards: BeerAward[]
}

/**
 * The current-beer card once everyone has rated, when it takes the whole width of the
 * projector: big average, big score bars, and every tag and note at a readable size.
 */
export function ScoreRevealPanel({ beer, scores, average, bestGuess, tags, raters, notes, justRevealed, showTags, awards }: ScoreRevealPanelProps) {
  const highest = Math.max(...scores)
  const lowest = Math.min(...scores)
  const showTagCloud = showTags && tags.length > 0
  // Two rows of notes fit under the bars on a big screen: two a row beside the tags, three without them
  const shownNotes = notes.slice(0, showTagCloud ? 4 : 6)
  const hasExtras = showTagCloud || shownNotes.length > 0

  return (
    <>
      <div className="w-full grid grid-cols-[minmax(0,1fr)_auto] items-center gap-10">
        <div className="min-w-0 flex items-center gap-6">
          <div className="beer-bob w-32 h-32 2xl:w-44 2xl:h-44 shrink-0 rounded-full bg-gold-soft flex items-center justify-center overflow-hidden">
            {beer.imageUrl ? (
              <Image src={beerImageSrc(beer.imageUrl)} alt={beer.name} width={200} height={200} className="object-contain max-h-[82%] w-auto" />
            ) : (
              <BeerPlaceholder className="h-3/4 w-auto text-[#7A3B12]" />
            )}
          </div>
          <div className="min-w-0 flex flex-col gap-2">
            {justRevealed ? (
              <span className="inline-flex items-center gap-2 text-xl 2xl:text-2xl font-extrabold tracking-[0.18em] uppercase text-cranberry">
                <Sparkles className="h-6 w-6" /> Einkunnir birtar!
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-xl 2xl:text-2xl font-extrabold tracking-[0.18em] uppercase text-holly">
                <PartyPopper className="h-6 w-6" /> Allir búnir
              </span>
            )}
            <h2 className="text-5xl 2xl:text-7xl leading-none line-clamp-2">{beer.name}</h2>
            <p className="flex items-center gap-4 min-w-0 text-2xl 2xl:text-3xl text-muted-foreground">
              <span className="truncate">
                {beer.brewery}
                {beer.containerSize && beer.containerType && ` · ${beer.containerSize} ml ${beer.containerType}`}
            {formatAbv(beer.abv) && ` · ${formatAbv(beer.abv)}`}
              </span>
              {beer.priceISK != null && (
                // Same per-can price as before the reveal, so it doesn't vanish when the card expands
                <span className="shrink-0 inline-flex items-baseline gap-1.5 rounded-full bg-holly px-4 py-0.5 text-cream">
                  <span className="font-extrabold tabular-nums">{Math.round(beer.priceISK).toLocaleString('is-IS')} kr</span>
                  {beer.containerType && <span className="text-base 2xl:text-lg font-semibold">/ {beer.containerType.toLowerCase()}</span>}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 text-right">
          <span className="text-2xl font-semibold text-muted-foreground">Meðaleinkunn</span>
          <span className="text-[length:min(11rem,9vw,15vh)] leading-[0.85] font-extrabold text-cranberry tabular-nums whitespace-nowrap">
            <CountUp value={average} durationMs={justRevealed ? 1800 : 600} />
          </span>
          <span className="mt-2 flex items-center gap-7 text-2xl 2xl:text-3xl font-semibold text-muted-foreground tabular-nums whitespace-nowrap">
            <span>{scores.length} einkunn{scores.length !== 1 ? 'ir' : ''}</span>
            <span className="inline-flex items-center gap-1" title="Hæsta einkunn">
              <ArrowUp className="h-7 w-7 text-holly" aria-label="Hæsta" />
              {highest.toFixed(1)}
            </span>
            <span className="inline-flex items-center gap-1" title="Lægsta einkunn">
              <ArrowDown className="h-7 w-7 text-cranberry" aria-label="Lægsta" />
              {lowest.toFixed(1)}
            </span>
          </span>
          {bestGuess && (
            <span className="mt-2 inline-flex items-center gap-2 text-2xl 2xl:text-3xl font-extrabold text-holly animate-in fade-in fill-mode-both duration-700 [animation-delay:1800ms]">
              <Brain className="h-7 w-7" />
              {bestGuess.userName} giskaði næst: {bestGuess.guess.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      <BeerAwardsStrip awards={awards} />

      {/* The bars take whatever height the header leaves. On a big screen the tags and notes sit
          under them; on a smaller projector there's no height for that, so they go beside them */}
      <div
        className={`w-full flex-1 min-h-0 flex flex-col gap-6 ${
          hasExtras ? 'max-2xl:grid max-2xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] max-2xl:gap-10' : ''
        }`}
      >
        <div className="flex-1 min-h-[10rem]">
          <ScoreBars size="lg" scores={scores} />
        </div>

        {hasExtras && (
          <div className="shrink-0 grid grid-cols-1 2xl:grid-cols-2 gap-5 2xl:gap-10 content-start [--tag-scale:1.2] 2xl:[--tag-scale:1.5]">
            {showTagCloud && (
              <div className="flex flex-col gap-3 animate-in fade-in duration-700" aria-label="Bragðlýsingar">
                <span className="text-2xl font-semibold text-muted-foreground">Bragðlýsingar</span>
                <TagCloud tags={tags} raters={raters} limit={10} align="start" />
              </div>
            )}
            {shownNotes.length > 0 && (
              <div className={`flex flex-col gap-3 animate-in fade-in duration-700 ${showTagCloud ? '' : '2xl:col-span-2'}`}>
                <span className="text-2xl font-semibold text-muted-foreground">Athugasemdir</span>
                {/* Named, like the right column. One a row beside the bars, so fewer of them fit there */}
                <ul
                  className={`grid gap-3 grid-cols-1 ${showTagCloud ? '2xl:grid-cols-2 max-2xl:[&>li:nth-child(n+3)]:hidden' : '2xl:grid-cols-3 max-2xl:[&>li:nth-child(n+5)]:hidden'}`}
                >
                  {shownNotes.map(note => (
                    <li
                      key={note.key}
                      className="flex items-center gap-3.5 rounded-2xl rounded-bl-sm border-2 border-cream-line bg-white/70 px-4 py-3 text-lg 2xl:text-2xl leading-snug"
                    >
                      <ParticipantAvatar
                        avatar={note.avatar}
                        seed={note.key}
                        className="w-16 h-16 2xl:w-20 2xl:h-20 shrink-0 shadow-sm"
                      />
                      <span className="min-w-0 flex-1 flex flex-col">
                        <span className="text-base 2xl:text-lg font-extrabold uppercase tracking-[0.06em] text-cranberry truncate">{note.name}</span>
                        <span className="line-clamp-2 2xl:line-clamp-3">„{note.note}“</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
