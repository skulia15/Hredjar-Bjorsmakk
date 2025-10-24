'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Edit, ArrowUpDown, Grid, List } from 'lucide-react'

interface Beer {
  id: string
  name: string
  brewery: string
  style?: string
  abv?: number
  country?: string
  imageUrl?: string
  description?: string
  containerSize?: number
  containerType?: string
  productNumber?: string
  vinbudinUrl?: string
  priceISK?: number
}

type SortOption =
  | 'name-asc'
  | 'name-desc'
  | 'brewery-asc'
  | 'brewery-desc'
  | 'price-asc'
  | 'price-desc'
  | 'abv-asc'
  | 'abv-desc'

export default function BeersPage() {
  const [beers, setBeers] = useState<Beer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('brewery-asc')
  const [editingBeer, setEditingBeer] = useState<Beer | null>(null)
  const [saving, setSaving] = useState(false)
  const [groupByBrewery, setGroupByBrewery] = useState(true)

  useEffect(() => {
    loadBeers()
  }, [])

  const loadBeers = async () => {
    try {
      const response = await fetch('/api/beers')
      if (!response.ok) throw new Error('Failed to load beers')
      const data = await response.json()
      setBeers(data.beers || [])
    } catch (err) {
      setError('Error loading beer catalog')
      console.error('Error loading beers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBeer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBeer) return

    setSaving(true)
    try {
      const response = await fetch(`/api/beers/${editingBeer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingBeer)
      })

      if (!response.ok) throw new Error('Failed to update beer')

      // Reload beers and close modal
      await loadBeers()
      setEditingBeer(null)
      setError('')
    } catch (err) {
      setError('Failed to save beer changes')
      console.error('Error saving beer:', err)
    } finally {
      setSaving(false)
    }
  }

  const sortBeers = (beersToSort: Beer[]) => {
    const sorted = [...beersToSort]

    switch (sortBy) {
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name))
      case 'brewery-asc':
        return sorted.sort((a, b) => a.brewery.localeCompare(b.brewery))
      case 'brewery-desc':
        return sorted.sort((a, b) => b.brewery.localeCompare(a.brewery))
      case 'price-asc':
        return sorted.sort((a, b) => (a.priceISK || 0) - (b.priceISK || 0))
      case 'price-desc':
        return sorted.sort((a, b) => (b.priceISK || 0) - (a.priceISK || 0))
      case 'abv-asc':
        return sorted.sort((a, b) => (a.abv || 0) - (b.abv || 0))
      case 'abv-desc':
        return sorted.sort((a, b) => (b.abv || 0) - (a.abv || 0))
      default:
        return sorted
    }
  }

  const filteredBeers = sortBeers(
    beers.filter(beer => {
      const query = searchQuery.toLowerCase()
      return (
        beer.name.toLowerCase().includes(query) ||
        beer.brewery.toLowerCase().includes(query) ||
        beer.style?.toLowerCase().includes(query) ||
        beer.country?.toLowerCase().includes(query)
      )
    })
  )

  // Group beers by brewery
  const groupedBeers = filteredBeers.reduce((acc, beer) => {
    const brewery = beer.brewery
    if (!acc[brewery]) {
      acc[brewery] = []
    }
    acc[brewery].push(beer)
    return acc
  }, {} as Record<string, Beer[]>)

  // Get sorted brewery names
  const breweryNames = Object.keys(groupedBeers).sort()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🍺</div>
          <p className="text-muted-foreground">Loading beer catalog...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Beer Catalog</h1>
            <Link href="/" className="text-sm text-primary hover:underline">
              ← Home
            </Link>
          </div>
          <p className="text-muted-foreground">
            Browse our collection of {beers.length} craft beers
          </p>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
            {error}
          </div>
        )}

        {/* Search, Sort, and Group Toggle */}
        <div className="bg-card p-4 rounded-lg border space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by name, brewery, style, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="flex items-center gap-2 md:min-w-[200px]">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="flex-1 px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="brewery-asc">Brewery (A-Z)</option>
                <option value="brewery-desc">Brewery (Z-A)</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
                <option value="abv-asc">ABV (Low to High)</option>
                <option value="abv-desc">ABV (High to Low)</option>
              </select>
            </div>
          </div>

          {/* Group Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGroupByBrewery(!groupByBrewery)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                groupByBrewery
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {groupByBrewery ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              {groupByBrewery ? 'Grouped by Brewery' : 'Show All'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>
            Showing {filteredBeers.length} of {beers.length} beers
          </span>
        </div>

        {/* Beer Display - Grouped or Ungrouped */}
        {filteredBeers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-muted-foreground">No beers found matching your search</p>
          </div>
        ) : groupByBrewery ? (
          /* Grouped by Brewery */
          <div className="space-y-8">
            {breweryNames.map((brewery) => (
              <div key={brewery} className="space-y-4">
                {/* Brewery Header */}
                <div className="flex items-center gap-3 pb-2 border-b">
                  <h2 className="text-2xl font-bold">{brewery}</h2>
                  <span className="text-sm text-muted-foreground">
                    ({groupedBeers[brewery].length} beer{groupedBeers[brewery].length !== 1 ? 's' : ''})
                  </span>
                </div>

                {/* Beers Grid for this Brewery */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedBeers[brewery].map((beer) => (
                    <div
                      key={beer.id}
                      className="bg-card p-6 rounded-lg border hover:border-primary transition-colors space-y-3 relative"
                    >
                      {/* Edit Button */}
                      <button
                        className="absolute top-4 right-4 p-2 rounded-md hover:bg-accent transition-colors"
                        onClick={() => setEditingBeer(beer)}
                        title="Edit beer"
                      >
                        <Edit className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </button>

                      {/* Beer Header */}
                      <div className="space-y-1 pr-8">
                        <h3 className="font-bold text-lg">{beer.name}</h3>
                      </div>

                      {/* Price - Prominent Display */}
                      {beer.priceISK && (
                        <div className="text-2xl font-bold text-green-600">
                          {beer.priceISK} kr
                        </div>
                      )}

                      {/* Beer Details */}
                      <div className="flex flex-wrap gap-2">
                        {beer.style && (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                            {beer.style}
                          </span>
                        )}
                        {beer.abv && (
                          <span className="px-2 py-1 bg-orange-500/10 text-orange-600 text-xs rounded">
                            {beer.abv}% ABV
                          </span>
                        )}
                        {beer.country && (
                          <span className="px-2 py-1 bg-blue-500/10 text-blue-600 text-xs rounded">
                            {beer.country}
                          </span>
                        )}
                      </div>

                      {/* Container Info */}
                      {(beer.containerSize || beer.containerType) && (
                        <div className="text-sm text-muted-foreground">
                          {beer.containerSize && beer.containerType && (
                            <span>{beer.containerSize}ml {beer.containerType}</span>
                          )}
                        </div>
                      )}

                      {/* Description */}
                      {beer.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {beer.description}
                        </p>
                      )}

                      {/* Links */}
                      <div className="flex gap-2 pt-2">
                        {beer.vinbudinUrl && (
                          <a
                            href={beer.vinbudinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            View on Vinbudin →
                          </a>
                        )}
                        {beer.productNumber && (
                          <span className="text-xs text-muted-foreground">
                            #{beer.productNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Ungrouped - Show All */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBeers.map((beer) => (
              <div
                key={beer.id}
                className="bg-card p-6 rounded-lg border hover:border-primary transition-colors space-y-3 relative"
              >
                {/* Edit Button */}
                <button
                  className="absolute top-4 right-4 p-2 rounded-md hover:bg-accent transition-colors"
                  onClick={() => setEditingBeer(beer)}
                  title="Edit beer"
                >
                  <Edit className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>

                {/* Beer Header */}
                <div className="space-y-1 pr-8">
                  <h3 className="font-bold text-lg">{beer.name}</h3>
                  <p className="text-muted-foreground">{beer.brewery}</p>
                </div>

                {/* Price - Prominent Display */}
                {beer.priceISK && (
                  <div className="text-2xl font-bold text-green-600">
                    {beer.priceISK} kr
                  </div>
                )}

                {/* Beer Details */}
                <div className="flex flex-wrap gap-2">
                  {beer.style && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                      {beer.style}
                    </span>
                  )}
                  {beer.abv && (
                    <span className="px-2 py-1 bg-orange-500/10 text-orange-600 text-xs rounded">
                      {beer.abv}% ABV
                    </span>
                  )}
                  {beer.country && (
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-600 text-xs rounded">
                      {beer.country}
                    </span>
                  )}
                </div>

                {/* Container Info */}
                {(beer.containerSize || beer.containerType) && (
                  <div className="text-sm text-muted-foreground">
                    {beer.containerSize && beer.containerType && (
                      <span>{beer.containerSize}ml {beer.containerType}</span>
                    )}
                  </div>
                )}

                {/* Description */}
                {beer.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {beer.description}
                  </p>
                )}

                {/* Links */}
                <div className="flex gap-2 pt-2">
                  {beer.vinbudinUrl && (
                    <a
                      href={beer.vinbudinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View on Vinbudin →
                    </a>
                  )}
                  {beer.productNumber && (
                    <span className="text-xs text-muted-foreground">
                      #{beer.productNumber}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8 border-t">
          <Link
            href="/"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 inline-block"
          >
            Return Home
          </Link>
        </div>
      </div>

      {/* Edit Modal */}
      {editingBeer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSaveBeer} className="p-6 space-y-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Edit Beer</h2>
                <button
                  type="button"
                  onClick={() => setEditingBeer(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBeer.name}
                    onChange={(e) => setEditingBeer({ ...editingBeer, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Brewery */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Brewery <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBeer.brewery}
                    onChange={(e) => setEditingBeer({ ...editingBeer, brewery: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Style */}
                <div>
                  <label className="block text-sm font-medium mb-1">Style</label>
                  <input
                    type="text"
                    value={editingBeer.style || ''}
                    onChange={(e) => setEditingBeer({ ...editingBeer, style: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* ABV */}
                <div>
                  <label className="block text-sm font-medium mb-1">ABV (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={editingBeer.abv || ''}
                    onChange={(e) => setEditingBeer({ ...editingBeer, abv: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <input
                    type="text"
                    value={editingBeer.country || ''}
                    onChange={(e) => setEditingBeer({ ...editingBeer, country: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Price ISK */}
                <div>
                  <label className="block text-sm font-medium mb-1">Price (ISK)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingBeer.priceISK || ''}
                    onChange={(e) => setEditingBeer({ ...editingBeer, priceISK: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Container Size */}
                <div>
                  <label className="block text-sm font-medium mb-1">Container Size (ml)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingBeer.containerSize || ''}
                    onChange={(e) => setEditingBeer({ ...editingBeer, containerSize: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Container Type */}
                <div>
                  <label className="block text-sm font-medium mb-1">Container Type</label>
                  <select
                    value={editingBeer.containerType || ''}
                    onChange={(e) => setEditingBeer({ ...editingBeer, containerType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select...</option>
                    <option value="Can">Can</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Keg">Keg</option>
                  </select>
                </div>

                {/* Product Number */}
                <div>
                  <label className="block text-sm font-medium mb-1">Product Number</label>
                  <input
                    type="text"
                    value={editingBeer.productNumber || ''}
                    onChange={(e) => setEditingBeer({ ...editingBeer, productNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Vinbudin URL */}
                <div>
                  <label className="block text-sm font-medium mb-1">Vinbudin URL</label>
                  <input
                    type="url"
                    value={editingBeer.vinbudinUrl || ''}
                    onChange={(e) => setEditingBeer({ ...editingBeer, vinbudinUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingBeer.description || ''}
                  onChange={(e) => setEditingBeer({ ...editingBeer, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingBeer(null)}
                  className="px-4 py-2 border rounded-md hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
