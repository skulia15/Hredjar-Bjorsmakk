'use client'

import { useState, useMemo } from 'react'
import { RankMedal } from '@/components/RankMedal'

interface Participant {
  id: string
  userName: string
  code: string
}

interface BeerRating {
  beerId: string
  name: string
  brewery: string
  average: number
  ratingsCount: number
  ratings: Record<string, number | null>
}

interface RatingsTableProps {
  participants: Participant[]
  beers: BeerRating[]
}

export function RatingsTable({ participants, beers }: RatingsTableProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<string | 'all'>('all')
  const [sortBy, setSortBy] = useState<'rank' | 'name'>('rank')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Filter and sort beers based on selected participant
  const filteredBeers = useMemo(() => {
    let result = [...beers]

    // If specific participant is selected, sort by their rating
    if (selectedParticipant !== 'all') {
      result.sort((a, b) => {
        const ratingA = a.ratings[selectedParticipant] ?? -1
        const ratingB = b.ratings[selectedParticipant] ?? -1
        return sortOrder === 'desc' ? ratingB - ratingA : ratingA - ratingB
      })
    } else {
      // Sort by average (rank) or name
      if (sortBy === 'rank') {
        result.sort((a, b) => sortOrder === 'desc' ? a.average - b.average : b.average - a.average)
      } else {
        result.sort((a, b) => {
          const comparison = a.name.localeCompare(b.name)
          return sortOrder === 'desc' ? -comparison : comparison
        })
      }
    }

    return result
  }, [beers, selectedParticipant, sortBy, sortOrder])

  // Get highlighted rating for selected participant
  const getHighlightedRating = (beer: BeerRating) => {
    if (selectedParticipant === 'all') return null
    return beer.ratings[selectedParticipant]
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          {/* Participant Filter */}
          <div className="flex-1">
            <label htmlFor="participant-filter" className="block text-sm font-medium mb-1">
              Sía eftir þátttakanda
            </label>
            <select
              id="participant-filter"
              value={selectedParticipant}
              onChange={(e) => setSelectedParticipant(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-card text-foreground"
            >
              <option value="all">Allir þátttakendur</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>
                  {p.userName}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Controls */}
          {selectedParticipant === 'all' && (
            <div className="flex-1">
              <label htmlFor="sort-by" className="block text-sm font-medium mb-1">
                Raða eftir
              </label>
              <div className="flex gap-2">
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'rank' | 'name')}
                  className="flex-1 px-3 py-2 rounded-lg border bg-card text-foreground"
                >
                  <option value="rank">Röðun (meðaleinkunn)</option>
                  <option value="name">Nafni</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 rounded-lg border bg-card hover:bg-muted transition-colors"
                  title={sortOrder === 'asc' ? 'Hækkandi' : 'Lækkandi'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold sticky left-0 bg-muted/50 z-10">
                Bjór
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold min-w-[100px]">
                Meðaltal
              </th>
              {participants.map(p => (
                <th
                  key={p.id}
                  className={`px-4 py-3 text-center text-sm font-semibold min-w-[80px] ${
                    selectedParticipant === p.id ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="truncate" title={p.userName}>
                    {p.userName}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredBeers.map((beer, index) => {
              const highlightedRating = getHighlightedRating(beer)

              return (
                <tr key={beer.beerId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 sticky left-0 bg-card z-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {selectedParticipant === 'all' && index < 3 && (
                          <span className="text-lg">
                            <RankMedal rank={index + 1} className="h-5 w-5" />
                          </span>
                        )}
                        <div className="font-medium text-sm">{beer.name}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{beer.brewery}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="font-bold text-primary">{beer.average.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{beer.ratingsCount} eink.</div>
                  </td>
                  {participants.map(p => {
                    const rating = beer.ratings[p.id]
                    const isHighlighted = selectedParticipant === p.id

                    return (
                      <td
                        key={p.id}
                        className={`px-4 py-3 text-center ${
                          isHighlighted ? 'bg-primary/10 font-bold' : ''
                        }`}
                      >
                        {rating !== null ? (
                          <span className={rating === highlightedRating && isHighlighted ? 'text-primary' : ''}>
                            {rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground text-center">
        Sýnir {filteredBeers.length} bjóra • {participants.length} þátttakendur
        {selectedParticipant !== 'all' && (
          <span className="ml-2">
            • Raðað eftir einkunnum {participants.find(p => p.id === selectedParticipant)?.userName}
          </span>
        )}
      </div>
    </div>
  )
}
