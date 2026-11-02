interface ProgressBeer {
  status: string
}

/** "Bjór 4 af 40" plus one segment per beer: finished, current or still to come */
export function ProgressStrip({ beers, currentBeerId }: { beers: ProgressBeer[]; currentBeerId?: string | null }) {
  if (beers.length === 0) return null
  const finished = beers.filter(b => b.status === 'finished').length
  // Counting the current beer as the one we're on; between beers, show how many are done
  const position = currentBeerId ? finished + 1 : finished

  return (
    <div className="flex items-center gap-4">
      <div className="text-xl 2xl:text-2xl font-semibold whitespace-nowrap tabular-nums">
        {currentBeerId ? `Bjór ${position} af ${beers.length}` : `${finished} af ${beers.length} búnir`}
      </div>
      {/*
        Fills left to right: done, then the beer on now, then what's left. Beers aren't tasted
        in list order, so painting each at its list position left gaps between finished ones.
        Untasted segments carry no name, so hovering can't spoil what's coming.
      */}
      <div className="flex-1 flex gap-1 h-3 min-w-[120px]" aria-hidden>
        {beers.map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors duration-500 ${
              i < finished
                ? 'bg-cranberry'
                : i === finished && currentBeerId
                  ? 'bg-gold animate-pulse'
                  : 'bg-pine-line'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
