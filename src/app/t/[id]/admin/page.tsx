'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { Beer as BeerIcon, ChevronDown, Home, Hourglass, Trash2, Trophy, Users } from 'lucide-react'
import { PendingRaters } from '@/components/PendingRaters'
import { BeerSelector } from '@/components/BeerSelector'
import { CurrentBeerTimer } from '@/components/CurrentBeerTimer'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import { SlideToConfirm } from '@/components/SlideToConfirm'

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
  beers?: Beer[]
  participantCount: number
}

export default function AdminPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise)
  const [tasting, setTasting] = useState<Tasting | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName] = useState('admin') // Admin user accessing admin page
  const [message, setMessage] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isFinishedBeersExpanded, setIsFinishedBeersExpanded] = useState(false)

  // Beer catalog state
  const [catalogBeers, setCatalogBeers] = useState<Array<{
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
  }>>([])

  useEffect(() => {
    loadTasting()
    const interval = setInterval(loadTasting, 5000)
    return () => clearInterval(interval)
  }, [params.id])

  // Check if user is admin
  useEffect(() => {
    fetch('/api/admin/check')
      .then(res => res.json())
      .then(data => {
        console.log('[Admin Check Response]', data)
        setIsAdmin(data.isAdmin || false)
      })
      .catch(err => console.error('Error checking admin status:', err))
  }, [])

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
    setMessage(`Bæti við ${beerIds.length} bjórum...`)
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
        setMessage(`Bætti við ${successes} bjórum, ${failures} mistókust`)
      } else {
        setMessage(`Tókst að bæta við ${successes} bjórum!`)
      }

      setTimeout(() => setMessage(''), 3000)
      loadTasting()
    } catch (error) {
      setMessage('Error adding beers')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleCreateCustom = async (data: { name: string; brewery: string; style?: string; abv?: number; productNumber?: string }) => {
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
    if (!confirm('Fjarlægja þennan bjór úr smökkuninni?')) return

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

  const handleRemoveParticipant = async (participantId: string) => {
    // Ask if they want to keep ratings
    const keepRatings = confirm(
      'Viltu HALDA einkunnum þessa þátttakanda?\n\n' +
      'Smelltu á OK til að HALDA einkunnum (þátttakandi fjarlægður af lista en einkunnir geymdar)\n' +
      'Smelltu á Hætta við til að EYÐA einkunnum (þátttakandi og allar hans einkunnir verða fjarlægðar)'
    )

    // Confirm the action
    const confirmMessage = keepRatings
      ? 'Fjarlægja þennan þátttakanda af listanum en geyma einkunnir?'
      : 'Fjarlægja þennan þátttakanda OG eyða öllum hans einkunnum?'

    if (!confirm(confirmMessage)) return

    try {
      const url = `/api/tastings/${params.id}/participants/${participantId}${keepRatings ? '?keepRatings=true' : ''}`
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove participant')
      }

      const data = await response.json()
      setMessage(data.message || 'Participant removed!')
      setTimeout(() => setMessage(''), 3000)
      loadTasting()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error removing participant')
      setTimeout(() => setMessage(''), 5000)
    }
  }

  const handleStartTasting = async () => {
    // Check if there are any beers
    if (!tasting || !tasting.beers || tasting.beers.length === 0) {
      setMessage('Please add at least one beer before starting')
      setTimeout(() => setMessage(''), 5000)
      return
    }

    try {
      // Start the tasting without automatically selecting a beer
      const response = await fetch(`/api/tastings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active', userName })
      })

      if (!response.ok) throw new Error('Failed to start tasting')

      setMessage('Smökkun hafin! Veldu núverandi bjór til að byrja.')
      setTimeout(() => setMessage(''), 5000)
      loadTasting()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error starting tasting')
      setTimeout(() => setMessage(''), 5000)
    }
  }

  const handleCompleteTasting = async () => {
    if (!confirm('Ljúka þessari smökkun? Ekki verður hægt að skrá fleiri einkunnir.')) return

    try {
      const response = await fetch(`/api/tastings/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed', userName })
      })

      if (!response.ok) throw new Error('Failed to complete tasting')

      setMessage('Smökkun lokið!')
      setTimeout(() => setMessage(''), 3000)
      loadTasting()
    } catch (error) {
      setMessage('Error completing tasting')
    }
  }

  const handleNudge = async () => {
    try {
      const response = await fetch(`/api/tastings/${params.id}/nudge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to send nudge')

      const data = await response.json()
      setMessage(data.message || 'Tilkynning send!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Villa við að senda tilkynningu')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BeerIcon className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Hleður...</p>
        </div>
      </div>
    )
  }

  if (!tasting) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Smökkun fannst ekki</h2>
          <Link href="/" className="text-primary hover:underline">
            Aftur á forsíðu
          </Link>
        </div>
      </div>
    )
  }

  const currentBeer = tasting.beers?.find(b => b.id === tasting.currentBeerId)
  const untastedBeers = tasting.beers?.filter(b => b.status === 'untasted') || []
  const finishedBeers = tasting.beers?.filter(b => b.status === 'finished') || []

  // Filter out beers that are already in the tasting (by matching name and brewery)
  const availableBeers = catalogBeers.filter(catalogBeer => {
    return !tasting.beers?.some(tastingBeer =>
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
            <span>{tasting.participantCount} þátttakendur</span>
            <span>{tasting.beers?.length || 0} bjórar</span>
          </div>
        </div>

        {/* Share Link */}
        <div className="bg-card p-4 rounded-lg border">
          <p className="text-sm font-medium mb-2">Deila tengli með þátttakendum:</p>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={`${window.location.origin}/t/${params.id}`}
              readOnly
              className="flex-1 px-3 py-2 bg-muted rounded text-sm"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/t/${params.id}`)
                setMessage('Tengill afritaður!')
                setTimeout(() => setMessage(''), 2000)
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Afrita
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
          >
            <Home className="w-4 h-4" />
            Forsíða
          </Link>
          <Link
            href={`/t/${params.id}/rate`}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
          >
            <Users className="w-4 h-4" />
            Þátttakandasýn
          </Link>
          <Link
            href={`/t/${params.id}/scores`}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
          >
            <Trophy className="w-4 h-4" />
            Stigatafla
          </Link>
          {isAdmin && (
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors bg-primary/5"
            >
              <Users className="w-4 h-4" />
              Notendastjórnun
            </Link>
          )}
        </div>

        {message && (
          <div className="p-3 bg-green-500/10 border border-green-500 text-green-600 rounded-md text-sm text-center">
            {message}
          </div>
        )}

        {/* Management Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Stjórna</h2>
          <div className="space-y-6">
              {/* Current Beer - Highlighted */}
              {currentBeer && (
                <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-lg border-2 border-green-500 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BeerIcon className="h-6 w-6 text-amber-500" />
                      <h3 className="font-bold text-lg text-green-700 dark:text-green-400">NÚVERANDI BJÓR</h3>
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
                        {currentBeer.ratingCount} einkunn{currentBeer.ratingCount !== 1 ? 'ir' : ''} skráð{currentBeer.ratingCount !== 1 ? 'ar' : ''}
                      </p>
                    )}
                  </div>
                  <SlideToConfirm
                    onConfirm={() => handleFinishBeer(currentBeer.id)}
                    text="Strjúka til að klára bjór"
                    confirmText="→"
                  />
                </div>
              )}

              {/* Pending Raters - shows who has/hasn't rated current beer */}
              {currentBeer && (
                <PendingRaters
                  tastingId={params.id}
                  currentBeerId={currentBeer.id}
                  refreshInterval={3000}
                  onRemoveParticipant={handleRemoveParticipant}
                  onNudge={handleNudge}
                />
              )}

              {/* Untasted Beers */}
              {untastedBeers.length > 0 && (
                <div className="bg-card p-4 rounded-lg border space-y-3">
                  <h3 className="font-semibold text-blue-600 dark:text-blue-400"><Hourglass className="inline h-4 w-4 mr-1 -mt-0.5" /> Ósmakkaðir bjórar ({untastedBeers.length})</h3>
                  <div className="space-y-2">
                    {untastedBeers.map((beer) => (
                      <div key={beer.id} className="flex flex-col gap-3 p-4 bg-blue-50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-800 rounded-md hover:border-blue-400 transition-colors">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-lg">{beer.name}</h4>
                          <p className="text-sm text-muted-foreground">{beer.brewery}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <button
                            onClick={() => handleSetCurrent(beer.id)}
                            disabled={tasting.status !== 'active' || !!currentBeer}
                            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Setja sem núverandi bjór
                          </button>
                          <button
                            onClick={() => handleDeleteBeer(beer.id)}
                            className="inline-flex items-center justify-center gap-1 px-3 py-2 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            title="Fjarlægja bjór"
                          >
                            <Trash2 className="w-4 h-4" />
                            Fjarlægja
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
                  <button
                    type="button"
                    onClick={() => setIsFinishedBeersExpanded(!isFinishedBeersExpanded)}
                    className="w-full flex items-center justify-between hover:opacity-80 transition-opacity"
                  >
                    <h3 className="font-semibold text-gray-600 dark:text-gray-400">✓ Smakkaðir bjórar ({finishedBeers.length})</h3>
                    <ChevronDown className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${isFinishedBeersExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {isFinishedBeersExpanded && (
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
                              {beer.ratingCount || 0} einkunnir
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tasting Controls */}
              <div className="bg-card p-4 rounded-lg border space-y-3">
                <h3 className="font-semibold">Smökkunarstjórnun</h3>
                {tasting.status === 'draft' && (!tasting.beers || tasting.beers.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    Bæta við að minnsta kosti einum bjór til að hefja smökkunina
                  </p>
                )}
                <div className="flex gap-2 flex-wrap">
                  {tasting.status === 'draft' && (
                    <button
                      onClick={handleStartTasting}
                      disabled={!tasting.beers || tasting.beers.length === 0}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title={!tasting.beers || tasting.beers.length === 0 ? 'Bættu við bjórum fyrst' : 'Hefja smökkun'}
                    >
                      Hefja smökkun
                    </button>
                  )}
                  {tasting.status === 'active' && (
                    <button
                      onClick={handleCompleteTasting}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-orange-700"
                    >
                      Enda smökkun
                    </button>
                  )}
                  <a
                    href={`/api/tastings/${params.id}/export?format=xlsx&userName=${userName}`}
                    download
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >
                    Flytja út XLSX
                  </a>
                  <a
                    href={`/api/tastings/${params.id}/export?format=csv&userName=${userName}`}
                    download
                    className="px-4 py-2 border rounded hover:bg-accent"
                  >
                    Flytja út CSV
                  </a>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  )
}
