'use client'

import { useState, useMemo } from 'react'
import { Search, Plus, ArrowLeft, Check } from 'lucide-react'

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
}

interface BeerSelectorProps {
  beers: Beer[]
  onSelectBeer: (beerId: string) => void
  onSelectMultipleBeers?: (beerIds: string[]) => void
  onCreateCustom: (data: { name: string; brewery: string; style?: string; abv?: number }) => void
}

export function BeerSelector({ beers, onSelectBeer, onSelectMultipleBeers, onCreateCustom }: BeerSelectorProps) {
  const [mode, setMode] = useState<'catalog' | 'custom'>('catalog')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBeerIds, setSelectedBeerIds] = useState<Set<string>>(new Set())

  // Custom beer form state
  const [customName, setCustomName] = useState('')
  const [customBrewery, setCustomBrewery] = useState('')
  const [customStyle, setCustomStyle] = useState('')
  const [customAbv, setCustomAbv] = useState('')

  const filteredBeers = useMemo(() => {
    if (!searchTerm) return beers
    const term = searchTerm.toLowerCase()
    return beers.filter(beer =>
      beer.name.toLowerCase().includes(term) ||
      beer.brewery.toLowerCase().includes(term) ||
      beer.style?.toLowerCase().includes(term)
    )
  }, [beers, searchTerm])

  const selectedBeers = beers.filter(b => selectedBeerIds.has(b.id))

  const toggleBeerSelection = (beerId: string) => {
    setSelectedBeerIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(beerId)) {
        newSet.delete(beerId)
      } else {
        newSet.add(beerId)
      }
      return newSet
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'catalog') {
      if (selectedBeerIds.size > 0) {
        if (onSelectMultipleBeers && selectedBeerIds.size > 1) {
          onSelectMultipleBeers(Array.from(selectedBeerIds))
        } else if (selectedBeerIds.size === 1) {
          onSelectBeer(Array.from(selectedBeerIds)[0])
        }
        // Reset
        setSelectedBeerIds(new Set())
        setSearchTerm('')
      }
    } else {
      if (customName && customBrewery) {
        onCreateCustom({
          name: customName,
          brewery: customBrewery,
          style: customStyle || undefined,
          abv: customAbv ? parseFloat(customAbv) : undefined
        })
        // Reset
        setCustomName('')
        setCustomBrewery('')
        setCustomStyle('')
        setCustomAbv('')
      }
    }
  }

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b bg-muted/50 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-lg">Add Beer</h3>
        <button
          type="button"
          onClick={() => setMode(mode === 'catalog' ? 'custom' : 'catalog')}
          className="flex items-center gap-2 text-sm text-primary hover:underline transition-colors"
        >
          {mode === 'catalog' ? (
            <>
              <Plus className="h-4 w-4" />
              Create Custom Beer
            </>
          ) : (
            <>
              <ArrowLeft className="h-4 w-4" />
              Select from Catalog
            </>
          )}
        </button>
      </div>

      {/* Content */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {mode === 'catalog' ? (
          /* Catalog Mode */
          <div className="space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search beers by name, brewery, or style..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              />
            </div>

            {/* Beer List */}
            <div className="border rounded-lg max-h-96 overflow-y-auto bg-background">
              {filteredBeers.length > 0 ? (
                <div className="divide-y">
                  {filteredBeers.map((beer) => {
                    const isSelected = selectedBeerIds.has(beer.id)
                    return (
                      <button
                        key={beer.id}
                        type="button"
                        onClick={() => toggleBeerSelection(beer.id)}
                        className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
                          isSelected ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-medium text-sm truncate">{beer.name}</div>
                              {beer.priceISK && (
                                <div className="text-sm font-semibold text-green-600 whitespace-nowrap">
                                  {beer.priceISK} kr
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{beer.brewery}</div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {beer.style && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                                  {beer.style}
                                </span>
                              )}
                              {beer.abv && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-orange-500/10 text-orange-600">
                                  {beer.abv}%
                                </span>
                              )}
                              {beer.containerSize && beer.containerType && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-600">
                                  {beer.containerSize}ml {beer.containerType}
                                </span>
                              )}
                              {beer.country && (
                                <span className="text-xs text-muted-foreground">
                                  {beer.country}
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="px-4 py-12 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'No beers found matching your search' : 'All catalog beers have been added to this tasting'}
                  </p>
                  {!searchTerm && (
                    <p className="text-xs text-muted-foreground">
                      Click "Create Custom Beer" above to add a custom beer
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Selected Beers Preview */}
            {selectedBeers.length > 0 && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  {selectedBeers.length} beer{selectedBeers.length !== 1 ? 's' : ''} selected:
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {selectedBeers.map(beer => (
                    <div key={beer.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold truncate block">{beer.name}</span>
                        <span className="text-xs text-muted-foreground truncate block">{beer.brewery}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleBeerSelection(beer.id)
                        }}
                        className="ml-2 text-muted-foreground hover:text-destructive"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={selectedBeerIds.size === 0}
              className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {selectedBeerIds.size > 0
                ? `Add ${selectedBeerIds.size} Beer${selectedBeerIds.size !== 1 ? 's' : ''}`
                : `Select beers to add (${filteredBeers.length} available)`
              }
            </button>
          </div>
        ) : (
          /* Custom Mode */
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="customName" className="block text-sm font-medium mb-1.5">
                  Beer Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="customName"
                  type="text"
                  placeholder="e.g., Winter Warmer"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="customBrewery" className="block text-sm font-medium mb-1.5">
                  Brewery <span className="text-destructive">*</span>
                </label>
                <input
                  id="customBrewery"
                  type="text"
                  placeholder="e.g., Local Brewery"
                  value={customBrewery}
                  onChange={(e) => setCustomBrewery(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="customStyle" className="block text-sm font-medium mb-1.5">
                  Style (optional)
                </label>
                <input
                  id="customStyle"
                  type="text"
                  placeholder="e.g., IPA, Stout"
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="customAbv" className="block text-sm font-medium mb-1.5">
                  ABV % (optional)
                </label>
                <input
                  id="customAbv"
                  type="number"
                  placeholder="e.g., 6.5"
                  value={customAbv}
                  onChange={(e) => setCustomAbv(e.target.value)}
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!customName || !customBrewery}
              className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Custom Beer
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
