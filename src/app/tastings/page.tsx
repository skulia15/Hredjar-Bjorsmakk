'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Beer as BeerIcon } from 'lucide-react'

interface Tasting {
  id: string
  title: string
  status: string
  createdAt: string
  participantCount: number
  beerCount: number
}

export default function TastingsPage() {
  const [tastings, setTastings] = useState<Tasting[]>([])
  const [loading, setLoading] = useState(true)
  const [canCreate, setCanCreate] = useState(false)

  useEffect(() => {
    loadTastings()
    checkPermissions()
  }, [])

  const checkPermissions = async () => {
    try {
      const response = await fetch('/api/session')
      const data = await response.json()
      setCanCreate(data.canCreateTastings || false)
    } catch (error) {
      console.error('Error checking permissions:', error)
    }
  }

  const loadTastings = async () => {
    try {
      const response = await fetch('/api/tastings')
      const data = await response.json()
      setTastings(data.tastings || [])
    } catch (error) {
      console.error('Error loading tastings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-500/10 text-gray-600',
      active: 'bg-green-50 text-green-600',
      closed: 'bg-blue-500/10 text-blue-600'
    }

    const labels = { draft: 'Drög', active: 'Í gangi', closed: 'Lokið' }

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}>
        {labels[status as keyof typeof labels] ?? status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BeerIcon className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Hleður smökkunum...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Allar smakkanir</h1>
          <div className="flex items-center justify-between">
       
            {canCreate && (
              <Link
                href="/create"
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Búa til nýja smökkun
              </Link>
            )}
          </div>
        </div>

        {/* Tastings List */}
        {tastings.length > 0 ? (
          <div className="space-y-3">
            {tastings.map((tasting) => (
              <Link
                key={tasting.id}
                href={`/t/${tasting.id}`}
                className="block bg-card p-4 rounded-lg border hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg">{tasting.title}</h3>
                      {getStatusBadge(tasting.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                      <span>{tasting.beerCount} bjór{tasting.beerCount !== 1 ? 'ar' : ''}</span>
                      <span>•</span>
                      <span>{tasting.participantCount} {tasting.participantCount === 1 ? 'þátttakandi' : 'þátttakendur'}</span>
                      <span>•</span>
                      <span>{new Date(tasting.createdAt).toLocaleDateString('is-IS')}</span>
                    </div>
                  </div>
                  <div className="shrink-0" aria-hidden>
                    <span className="text-primary">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BeerIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Engar smakkanir ennþá</p>
            {canCreate && (
              <Link
                href="/create"
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 inline-block"
              >
                Búa til fyrstu smökkun
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
