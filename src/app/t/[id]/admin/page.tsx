'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { Home, Users, Trophy, Trash2 } from 'lucide-react'
import { PendingRaters } from '@/components/PendingRaters'
import { BeerSelector } from '@/components/BeerSelector'
import { CurrentBeerTimer } from '@/components/CurrentBeerTimer'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'

interface Beer {
  id: string
  name: string
  brewery: string
  style?: string
  abv?: number
  containerSize?: number
  containerType?: string
  priceISK?: number
  status: string
  orderIndex: number
  currentSince?: Date | string | null
  finishedAt?: Date | string | null
  averageRating?: number
  ratingCount?: number
}

interface Tasting {
  id: string
  title: string
  status: string
  currentBeerId?: string | null
  beers: Beer[]
  participantCount: number
}

type TabType = 'manage' | 'rate' | 'scores' | 'analytics'

export default function AdminPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const [tasting, setTasting] = useState<Tasting | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('manage')
  const [loading, setLoading] = useState(true)
  const [userName] = useState('admin') // Admin user accessing admin page
  const [message, setMessage] = useState('')

  // Beer catalog state
  const [catalogBeers, setCatalogBeers] = useState<Array<{
    id: string
    name: string
    brewery: string
    style?: string
    abv?: number
    country?: string
  }>>([])

  useEffect(() => {
    loadTasting()
    const interval = setInterval(loadTasting, 5000)
    return () => clearInterval(interval)
  }, [params.id])

  // Load beer catalog
  useEffect(() => {
    fetch('/api/beers')
      .then(res => res.json())
      .then(data => setCatalogBeers(data.beers || []))
      .catch(err => console.error('Error loading beer catalog:', err))
  }, [])

  const loadTasting = async () => {
    try {
      const response = await fetch(`/api/tastings/${params.id}`)
      const data = await response.json()
      setTasting(data)
    } catch (error) {
      console.error('Error loading tasting:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectBeer = async (beerId: string) => {
    setMessage('')
    try {
      const response = await fetch(`/api/tastings/${params.id}/beers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beerId, userName })
      })

      if (!response.ok) throw new Error('Failed to add beer')

      setMessage('Beer added successfully!')
      setTimeout(() => setMessage(''), 3000)
      loadTasting()
    } catch (error) {
      setMessage('Error adding beer')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleSelectMultipleBeers = async (beerIds: string[]) => {
    setMessage(`Adding ${beerIds.length} beers...`)
    try {
      // Add all beers in parallel
      const results = await Promise.allSettled(
        beerIds.map(beerId =>
          fetch(`/api/tastings/${params.id}/beers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ beerId, userName })
          })
        )
      )

      // Count successes and failures
      const successes = results.filter(r => r.status === 'fulfilled').length
      const failures = results.filter(r => r.status === 'rejected').length

      if (failures > 0) {
        setMessage(`Added ${successes} beers, ${failures} failed`)
      } else {
        setMessage(`Successfully added ${successes} beers!`)
      }

      setTimeout(() => setMessage(''), 3000)
      loadTasting()
    } catch (error) {
      setMessage('Error adding beers')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleCreateCustom = async (data: { name: string; brewery: string; style?: string; abv?: number }) => {
    setMessage('')
    try {
      const response = await fetch(`/api/tastings/${params.id}/beers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userName })
      })

      if (!response.ok) throw new Error('Failed to add beer')

      setMessage('Custom beer added successfully!')
      setTimeout(() => setMessage(''), 3000)
      loadTasting()
    } catch (error) {
      setMessage('Error adding custom beer')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleSetCurrent = async (beerId: string) => {
    try {
      const response = await fetch(`/api/tastings/${params.id}/current`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beerId, userName })
      })

      if (!response.ok) throw new Error('Failed to set current beer')

      setMessage('Current beer updated!')
      setTimeout(() => setMessage(''), 3000)
      loadTasting()
    } catch (error) {
      setMessage('Error setting current beer')
    }
  }

  const handleFinishBeer = async (beerId: string) => {
    if (!confirm('Finish this beer? Participants will no longer be able to rate it.')) return

    try {
      const response = await fetch(`/api/tastings/${params.id}/beers/${beerId}/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName })
      })

      if (!response.ok) throw new Error('Failed to finish beer')

      setMessage('Beer finished!')
      setTimeout(() => setMessage(''), 3000)
      loadTasting()
    } catch (error) {
      setMessage('Error finishing beer')
    }
  }

  const handleDeleteBeer = async (beerId: string) => {
    if (!confirm('Remove this beer from the tasting?')) return

    try {
      const response = await fetch(`/api/tastings/${params.id}/beers/${beerId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete beer')
      }

      setMessage('Beer removed!')
      setTimeout(() => setMessage(''), 3000)
      loadTasting()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error deleting beer')
      setTimeout(() => setMessage(''), 5000)
    }
  }

  const handleStartTasting = async () => {
    try {
      const response = await fetch(`/api/tastings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active', userName })
      })

      if (!response.ok) throw new Error('Failed to start tasting')

      setMessage('Tasting started!')
      setTimeout(() => setMessage(''), 3000)
      loadTasting()
    } catch (error) {
      setMessage('Error starting tasting')
    }
  }

  const handleCompleteTasting = async () => {
    if (!confirm('Complete this tasting? No more ratings can be submitted.')) return

    try {
      const response = await fetch(`/api/tastings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed', userName })
      })

      if (!response.ok) throw new Error('Failed to complete tasting')

      setMessage('Tasting completed!')
      setTimeout(() => setMessage(''), 3000)
      loadTasting()
    } catch (error) {
      setMessage('Error completing tasting')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍺</div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!tasting) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Tasting Not Found</h2>
          <Link href="/" className="text-primary hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  const currentBeer = tasting.beers.find(b => b.id === tasting.currentBeerId)
  const untastedBeers = tasting.beers.filter(b => b.status === 'untasted')
  const finishedBeers = tasting.beers.filter(b => b.status === 'finished')

  // Filter out beers that are already in the tasting (by matching name and brewery)
  const availableBeers = catalogBeers.filter(catalogBeer => {
    return !tasting.beers.some(tastingBeer =>
      tastingBeer.name === catalogBeer.name && tastingBeer.brewery === catalogBeer.brewery
    )
  })

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{tasting.title}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="px-2 py-1 bg-primary/10 rounded">{tasting.status}</span>
            <span>{tasting.participantCount} participants</span>
            <span>{tasting.beers.length} beers</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link
              href={`/t/${params.id}/rate`}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
            >
              <Users className="w-4 h-4" />
              Participant View
            </Link>
            <Link
              href={`/t/${params.id}/scores`}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </Link>
          </div>
        </div>

        {/* Share Link */}
        <div className="bg-card p-4 rounded-lg border">
          <p className="text-sm font-medium mb-2">Share this link with participants:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={`${window.location.origin}/t/${params.id}`}
              readOnly
              className="flex-1 px-3 py-2 bg-muted rounded text-sm"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/t/${params.id}`)
                setMessage('Link copied!')
                setTimeout(() => setMessage(''), 2000)
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Copy
            </button>
          </div>
        </div>

        {message && (
          <div className="p-3 bg-green-500/10 border border-green-500 text-green-600 rounded-md text-sm text-center">
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b">
          <div className="flex gap-4">
            {(['manage', 'analytics', 'rate', 'scores'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'manage' && (
            <div className="space-y-6">
              {/* Tasting Controls */}
              <div className="bg-card p-4 rounded-lg border space-y-3">
                <h3 className="font-semibold">Tasting Controls</h3>
                <div className="flex gap-2">
                  {tasting.status === 'draft' && (
                    <button
                      onClick={handleStartTasting}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Start Tasting
                    </button>
                  )}
                  {tasting.status === 'active' && (
                    <button
                      onClick={handleCompleteTasting}
                      className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      Complete Tasting
                    </button>
                  )}
                  <a
                    href={`/api/tastings/${params.id}/export?format=xlsx&userName=${userName}`}
                    download
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >
                    Export XLSX
                  </a>
                  <a
                    href={`/api/tastings/${params.id}/export?format=csv&userName=${userName}`}
                    download
                    className="px-4 py-2 border rounded hover:bg-accent"
                  >
                    Export CSV
                  </a>
                </div>
              </div>

              {/* Current Beer - Highlighted */}
              {currentBeer && (
                <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-lg border-2 border-green-500 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🍺</span>
                      <h3 className="font-bold text-lg text-green-700 dark:text-green-400">CURRENT BEER</h3>
                    </div>
                    {currentBeer.currentSince && (
                      <CurrentBeerTimer
                        currentSince={currentBeer.currentSince}
                        colorCoded={true}
                        size="md"
                      />
                    )}
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-md">
                    <h4 className="font-bold text-xl">{currentBeer.name}</h4>
                    <p className="text-muted-foreground text-lg">{currentBeer.brewery}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {currentBeer.containerSize && currentBeer.containerType && (
                        <span className="text-sm text-muted-foreground">
                          {currentBeer.containerSize}ml {currentBeer.containerType}
                        </span>
                      )}
                      {currentBeer.priceISK && (
                        <span className="text-sm font-semibold text-green-600">
                          {currentBeer.priceISK} kr
                        </span>
                      )}
                    </div>
                    {currentBeer.ratingCount !== undefined && (
                      <p className="text-sm font-semibold text-green-600 mt-2">
                        {currentBeer.ratingCount} rating{currentBeer.ratingCount !== 1 ? 's' : ''} submitted
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleFinishBeer(currentBeer.id)}
                    className="w-full px-4 py-3 bg-orange-600 text-white rounded-md font-semibold hover:bg-orange-700 transition-colors"
                  >
                    Finish This Beer
                  </button>
                </div>
              )}

              {/* Pending Raters - shows who has/hasn't rated current beer */}
              {currentBeer && (
                <PendingRaters
                  tastingId={params.id}
                  currentBeerId={currentBeer.id}
                  refreshInterval={3000}
                />
              )}

              {/* Untasted Beers */}
              {untastedBeers.length > 0 && (
                <div className="bg-card p-4 rounded-lg border space-y-3">
                  <h3 className="font-semibold text-blue-600 dark:text-blue-400">⏳ Untasted Beers ({untastedBeers.length})</h3>
                  <div className="space-y-2">
                    {untastedBeers.map((beer) => (
                      <div key={beer.id} className="flex items-center justify-between gap-3 p-4 bg-blue-50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-800 rounded-md hover:border-blue-400 transition-colors">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-lg truncate">{beer.name}</h4>
                          <p className="text-sm text-muted-foreground truncate">{beer.brewery}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleDeleteBeer(beer.id)}
                            className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            title="Remove beer"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                          <button
                            onClick={() => handleSetCurrent(beer.id)}
                            disabled={tasting.status !== 'active' || !!currentBeer}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Set Current
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Beer - Beautiful Searchable Selector */}
              <BeerSelector
                beers={availableBeers}
                onSelectBeer={handleSelectBeer}
                onSelectMultipleBeers={handleSelectMultipleBeers}
                onCreateCustom={handleCreateCustom}
              />

              {/* Finished Beers */}
              {finishedBeers.length > 0 && (
                <div className="bg-card p-4 rounded-lg border space-y-3">
                  <h3 className="font-semibold text-gray-600 dark:text-gray-400">✓ Finished Beers ({finishedBeers.length})</h3>
                  <div className="space-y-2">
                    {finishedBeers.map((beer) => (
                      <div key={beer.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-md opacity-75">
                        <div>
                          <h4 className="font-semibold text-lg">{beer.name}</h4>
                          <p className="text-sm text-muted-foreground">{beer.brewery}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {beer.averageRating?.toFixed(2) || 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {beer.ratingCount || 0} ratings
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <AnalyticsDashboard tastingId={params.id} />
          )}

          {activeTab === 'rate' && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Rate beers just like participants
              </p>
              <Link
                href={`/t/${params.id}/rate`}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 inline-block"
              >
                Go to Rating Page
              </Link>
            </div>
          )}

          {activeTab === 'scores' && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                View the leaderboard
              </p>
              <Link
                href={`/t/${params.id}/scores`}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 inline-block"
              >
                Go to Scores Page
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
