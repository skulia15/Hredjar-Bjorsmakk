'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Beer as BeerIcon } from 'lucide-react'
import { RankMedal } from '@/components/RankMedal'

interface LeaderboardBeer {
  beerId: string
  name: string
  brewery: string
  average: number
  count: number
  rank: number
}

interface Beer {
  id: string
  name: string
  brewery: string
  style?: string
  abv?: number
  country?: string
  containerSize?: number
  containerType?: string
  priceISK?: number
  imageUrl?: string
  status: string
}

interface Tasting {
  id: string
  title: string
  status: string
  currentBeerId?: string | null
  beers: Beer[]
}

interface LeaderboardWaitingProps {
  tastingId: string
  refreshInterval?: number
  isLeader?: boolean
  participantName?: string
}

export function LeaderboardWaiting({
  tastingId,
  refreshInterval = 5000,
  isLeader = false,
  participantName
}: LeaderboardWaitingProps) {
  const [beers, setBeers] = useState<LeaderboardBeer[]>([])
  const [loading, setLoading] = useState(true)
  const [tasting, setTasting] = useState<Tasting | null>(null)
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadLeaderboard()
    loadTasting()
    const interval = setInterval(() => {
      loadLeaderboard()
      loadTasting()
    }, refreshInterval)
    return () => clearInterval(interval)
  }, [tastingId, refreshInterval])

  const loadLeaderboard = async () => {
    try {
      const response = await fetch(`/api/tastings/${tastingId}/leaderboard`)
      if (!response.ok) throw new Error('Failed to load leaderboard')

      const data = await response.json()
      setBeers(data.beers)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTasting = async () => {
    try {
      const response = await fetch(`/api/tastings/${tastingId}`)
      if (!response.ok) return
      const data = await response.json()
      setTasting(data)
    } catch (error) {
      console.error('Error loading tasting:', error)
    }
  }

  const handleSetCurrent = async (beerId: string) => {
    try {
      const response = await fetch(`/api/tastings/${tastingId}/current`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beerId, userName: participantName || 'leader' })
      })

      if (!response.ok) throw new Error('Failed to set current beer')

      setMessage('Núverandi bjór uppfærður!')
      setTimeout(() => setMessage(''), 3000)
      loadTasting()
    } catch (error) {
      setMessage('Villa við að velja bjór')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <BeerIcon className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Hleður stigatöflu...</p>
        </div>
      </div>
    )
  }

  const untastedBeers = tasting?.beers?.filter(b => b.status === 'untasted') || []

  // Filter untasted beers by search term
  const filteredUntastedBeers = untastedBeers.filter(beer => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      beer.name.toLowerCase().includes(term) ||
      beer.brewery.toLowerCase().includes(term)
    )
  })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Bestu bjórarnir hingað til</h1>
          <p className="text-sm text-muted-foreground">
            {isLeader ? 'Veldu næsta bjór til að halda áfram' : 'Bíður eftir næsta bjór...'}
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-3 rounded-md text-sm text-center ${
            message.includes('Villa')
              ? 'bg-destructive/10 text-destructive'
              : 'bg-green-500/10 text-green-600'
          }`}>
            {message}
          </div>
        )}

        {/* Leaderboard */}
        {beers.length > 0 ? (
          <div className="space-y-3">
            {beers.slice(0, 5).map((beer) => (
              <div
                key={beer.beerId}
                className={`bg-card p-4 rounded-lg border ${
                  beer.rank <= 3 ? 'border-primary' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <RankMedal rank={beer.rank} className="h-7 w-7" />
                      <h3 className="font-bold text-lg">{beer.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{beer.brewery}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-primary">
                      {beer.average.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {beer.count} einkunn{beer.count !== 1 ? 'ir' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BeerIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Engir bjórar kláraðir ennþá</p>
          </div>
        )}

        {/* Leader Controls */}
        {isLeader && untastedBeers.length > 0 && (
          <div className="bg-card p-4 rounded-lg border space-y-3">
            <h3 className="font-semibold text-blue-600 dark:text-blue-400">
              Veldu næsta bjór
            </h3>

            {/* Search Bar */}
            {untastedBeers.length > 3 && (
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Leita eftir nafni eða brugghúsi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                />
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUntastedBeers.length > 0 ? (
                filteredUntastedBeers.map((beer) => (
                  <div
                    key={beer.id}
                    className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-800 rounded-md"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold">{beer.name}</h4>
                      <p className="text-sm text-muted-foreground">{beer.brewery}</p>
                    </div>
                    <button
                      onClick={() => handleSetCurrent(beer.id)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
                    >
                      Smakka núna
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Engir bjórar fundust
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leader Admin Link */}
        {isLeader && (
          <div className="text-center">
            <Link
              href={`/t/${tastingId}/admin`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Fara í leiðtogasýn
            </Link>
          </div>
        )}

        {/* Link to full scores */}
        <div className="text-center">
          <Link
            href={`/t/${tastingId}/scores`}
            className="text-sm text-primary hover:underline"
          >
            Skoða allar einkunnir →
          </Link>
        </div>
      </div>
    </div>
  )
}
