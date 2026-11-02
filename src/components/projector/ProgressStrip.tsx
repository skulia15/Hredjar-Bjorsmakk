interface ProgressBeer {
  id: string
  name: string
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
      <div className="flex-1 flex gap-1 h-3 min-w-[120px]">
        {beers.map(beer => (
          <div
            key={beer.id}
            title={beer.name}
            className={`flex-1 rounded-full transition-colors duration-500 ${
              beer.id === currentBeerId
                ? 'bg-gold animate-pulse'
                : beer.status === 'finished'
                  ? 'bg-cranberry'
                  : 'bg-pine-deep'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
