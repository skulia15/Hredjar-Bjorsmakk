'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Beer as BeerIcon } from 'lucide-react'

interface Tasting {
  id: string
  title: string
  status: string
  createdAt: string
  createdBy: string | null
  createdByName: string | null
  participantCount: number
  beerCount: number
  ratingCount: number
  finishedBeerCount: number
}

export default function AdminTastingsPage() {
  const [tastings, setTastings] = useState<Tasting[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    closed: 0,
    draft: 0
  })

  useEffect(() => {
    loadTastings()
  }, [])

  const loadTastings = async () => {
    try {
      const response = await fetch('/api/admin/tastings')

      if (!response.ok) {
        throw new Error('Failed to load tastings')
      }

      const data = await response.json()
      setTastings(data.tastings || [])

      // Calculate stats
      const total = data.tastings.length
      const active = data.tastings.filter((t: Tasting) => t.status === 'active').length
      const closed = data.tastings.filter((t: Tasting) => t.status === 'closed').length
      const draft = data.tastings.filter((t: Tasting) => t.status === 'draft').length

      setStats({ total, active, closed, draft })
    } catch (error) {
      console.error('Error loading tastings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-500/10 text-gray-600',
      active: 'bg-green-500/10 text-green-600',
      closed: 'bg-blue-500/10 text-blue-600'
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}>
        {status}
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Admin: Allar smakkanir</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/users"
              className="text-sm text-primary hover:underline"
            >
              ← Aftur á notendastjórnun
            </Link>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Fjöldi smakkana</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-muted-foreground">Virkar</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{stats.closed}</div>
            <div className="text-sm text-muted-foreground">Búnar</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <div className="text-sm text-muted-foreground">Drög</div>
          </div>
        </div>

        {/* Tastings Table */}
        {tastings.length > 0 ? (
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Nafn</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Staða</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Búið til af</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Tölfræði</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Búið til</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Aðgerðir</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tastings.map((tasting) => (
                    <tr key={tasting.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{tasting.title}</div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(tasting.status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {tasting.createdByName || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <div className="space-y-1">
                          <div>{tasting.participantCount} Þátttakendur</div>
                          <div>{tasting.beerCount} bjórar ({tasting.finishedBeerCount} smakkaðir)</div>
                          <div>{tasting.ratingCount} einkunnir</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(tasting.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/t/${tasting.id}/scores`}
                            className="text-sm text-primary hover:underline"
                          >
                            Einkunnir
                          </Link>
                          <Link
                            href={`/t/${tasting.id}/admin`}
                            className="text-sm text-primary hover:underline"
                          >
                            Stjórna
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <BeerIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Engar smakkanir fundust</p>
          </div>
        )}
      </div>
    </div>
  )
}
