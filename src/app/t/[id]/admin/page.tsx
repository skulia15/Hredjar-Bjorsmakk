'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { PendingRaters } from '@/components/PendingRaters'
import { BeerSelector } from '@/components/BeerSelector'
import { CurrentBeerTimer } from '@/components/CurrentBeerTimer'

interface Beer {
  id: string
  name: string
  brewery: string
  style?: string
  abv?: number
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

type TabType = 'manage' | 'rate' | 'scores'

export default function AdminPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const [tasting, setTasting] = useState<Tasting | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('manage')
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('skuli') // TODO: Get from session
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
          <div className="flex gap-2">
            <Link
              href={`/t/${params.id}/rate`}
              className="text-sm text-primary hover:underline"
            >
              Participant View →
            </Link>
            <Link
              href={`/t/${params.id}/scores`}
              className="text-sm text-primary hover:underline"
            >
              Leaderboard →
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
            {(['manage', 'rate', 'scores'] as TabType[]).map((tab) => (
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

              {/* Current Beer */}
              {currentBeer && (
                <div className="bg-card p-4 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-green-600">🍺 Current Beer</h3>
                    {currentBeer.currentSince && (
                      <CurrentBeerTimer
                        currentSince={currentBeer.currentSince}
                        colorCoded={true}
                        size="md"
                      />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{currentBeer.name}</h4>
                    <p className="text-muted-foreground">{currentBeer.brewery}</p>
                    {currentBeer.ratingCount !== undefined && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {currentBeer.ratingCount} rating{currentBeer.ratingCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleFinishBeer(currentBeer.id)}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
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
                  <h3 className="font-semibold">Untasted Beers ({untastedBeers.length})</h3>
                  <div className="space-y-2">
                    {untastedBeers.map((beer) => (
                      <div key={beer.id} className="flex items-center justify-between p-3 bg-muted rounded">
                        <div>
                          <h4 className="font-medium">{beer.name}</h4>
                          <p className="text-sm text-muted-foreground">{beer.brewery}</p>
                        </div>
                        <button
                          onClick={() => handleSetCurrent(beer.id)}
                          disabled={tasting.status !== 'active' || !!currentBeer}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Set Current
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Beer - Beautiful Searchable Selector */}
              <BeerSelector
                beers={catalogBeers}
                onSelectBeer={handleSelectBeer}
                onCreateCustom={handleCreateCustom}
              />

              {/* Finished Beers */}
              {finishedBeers.length > 0 && (
                <div className="bg-card p-4 rounded-lg border space-y-3">
                  <h3 className="font-semibold">Finished Beers ({finishedBeers.length})</h3>
                  <div className="space-y-2">
                    {finishedBeers.map((beer) => (
                      <div key={beer.id} className="flex items-center justify-between p-3 bg-muted rounded">
                        <div>
                          <h4 className="font-medium">{beer.name}</h4>
                          <p className="text-sm text-muted-foreground">{beer.brewery}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
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
