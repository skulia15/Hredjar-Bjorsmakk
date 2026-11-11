'use client'

import { useState, useMemo } from 'react'
import { Search, Plus, ArrowLeft, Check, Play } from 'lucide-react'
import { BeerPlaceholder } from './BeerPlaceholder'
import { beerImageSrc } from '@/lib/beerImage'

interface Beer {
  id: string
  name: string
  brewery: string
  styles?: string[]
  abv?: number
  country?: string
  containerSize?: number
  containerType?: string
  priceISK?: number
  imageUrl?: string
}

export interface CustomBeerData {
  name: string
  brewery: string
  style?: string
  abv?: number
  productNumber?: string
}

interface BeerSelectorProps {
  beers: Beer[]
  onSelectBeer: (beerId: string, options: { makeCurrent: boolean }) => void
  onSelectMultipleBeers?: (beerIds: string[]) => void
  onCreateCustom: (data: CustomBeerData, options: { makeCurrent: boolean }) => void
  // Shows "add and make current" so a leader can pick the next beer on the fly mid-tasting
  canMakeCurrent?: boolean
}

export function BeerSelector({ beers, onSelectBeer, onSelectMultipleBeers, onCreateCustom, canMakeCurrent = false }: BeerSelectorProps) {
  const [mode, setMode] = useState<'catalog' | 'custom'>('catalog')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBeerIds, setSelectedBeerIds] = useState<Set<string>>(new Set())

  // Custom beer form state
  const [customName, setCustomName] = useState('')
  const [customBrewery, setCustomBrewery] = useState('')
  const [customStyle, setCustomStyle] = useState('')
  const [customAbv, setCustomAbv] = useState('')
  const [customProductNumber, setCustomProductNumber] = useState('')

  const filteredBeers = useMemo(() => {
    if (!searchTerm) return beers
    const term = searchTerm.toLowerCase()
    return beers.filter(beer =>
      beer.name.toLowerCase().includes(term) ||
      beer.brewery.toLowerCase().includes(term) ||
      beer.styles?.some(style => style.toLowerCase().includes(term))
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

  // Only one beer can be current, so "add and make current" needs exactly one picked
  const makeCurrentEnabled = canMakeCurrent && (mode === 'custom' ? !!customName && !!customBrewery : selectedBeerIds.size === 1)

  const submit = (makeCurrent: boolean) => {
    if (mode === 'catalog') {
      if (selectedBeerIds.size > 0) {
        if (makeCurrent && selectedBeerIds.size !== 1) return
        if (onSelectMultipleBeers && selectedBeerIds.size > 1) {
          onSelectMultipleBeers(Array.from(selectedBeerIds))
        } else if (selectedBeerIds.size === 1) {
          onSelectBeer(Array.from(selectedBeerIds)[0], { makeCurrent })
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
          abv: customAbv ? parseFloat(customAbv) : undefined,
          productNumber: customProductNumber || undefined
        }, { makeCurrent })
        // Reset
        setCustomName('')
        setCustomBrewery('')
        setCustomStyle('')
        setCustomAbv('')
        setCustomProductNumber('')
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submit(false)
  }

  const makeCurrentButton = canMakeCurrent && (
    <button
      type="button"
      onClick={() => submit(true)}
      disabled={!makeCurrentEnabled}
      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Play className="h-4 w-4" />
      {mode === 'catalog' && selectedBeerIds.size > 1
        ? 'Veldu einn bjór til að setja sem núverandi'
        : 'Bæta við og setja sem núverandi'}
    </button>
  )

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b bg-muted/50 px-4 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-lg">Bæta við bjór</h3>
        <button
          type="button"
          onClick={() => setMode(mode === 'catalog' ? 'custom' : 'catalog')}
          className="flex items-center gap-2 text-sm text-primary hover:underline transition-colors"
        >
          {mode === 'catalog' ? (
            <>
              <Plus className="h-4 w-4" />
              Búa til nýjan bjór
            </>
          ) : (
            <>
              <ArrowLeft className="h-4 w-4" />
              Velja úr lista
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
                placeholder="Leita eftir nafni, brugghúsi eða stíl..."
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
                          {/* Beer Image */}
                          <div className="flex-shrink-0 w-16 flex justify-center">
                            {beer.imageUrl ? (
                              <img
                                src={beerImageSrc(beer.imageUrl)}
                                alt={beer.name}
                                className="h-16 w-auto object-contain"
                                onError={(e) => {
                                  // Show placeholder if image fails to load
                                  const parent = e.currentTarget.parentElement
                                  if (parent) {
                                    e.currentTarget.style.display = 'none'
                                    const placeholder = parent.querySelector('.beer-placeholder')
                                    if (placeholder) {
                                      (placeholder as HTMLElement).style.display = 'block'
                                    }
                                  }
                                }}
                              />
                            ) : null}
                            <div className={beer.imageUrl ? 'hidden beer-placeholder' : 'beer-placeholder'}>
                              <BeerPlaceholder className="h-16 w-auto text-muted-foreground" />
                            </div>
                          </div>
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
                              {beer.styles?.map(style => (
                                <span key={style} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                                  {style}
                                </span>
                              ))}
                              {beer.abv != null && (
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
                    {searchTerm ? 'Engir bjórar fundust sem passa við leitina' : 'Allir bjórar í listanum hafa verið bættir við þessa smökkun'}
                  </p>
                  {!searchTerm && (
                    <p className="text-xs text-muted-foreground">
                      Smelltu á &quot;Búa til sérsniðinn bjór&quot; hér að ofan til að bæta við sérsniðnum bjór
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Selected Beers Preview */}
            {selectedBeers.length > 0 && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  {selectedBeers.length} bjór{selectedBeers.length !== 1 ? 'ar' : ''} val{selectedBeers.length !== 1 ? 'dir' : 'inn'}:
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
                        title="Fjarlægja"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {makeCurrentButton}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={selectedBeerIds.size === 0}
              className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {selectedBeerIds.size > 0
                ? `Bæta við ${selectedBeerIds.size} bjór${selectedBeerIds.size !== 1 ? 'um' : ''}${canMakeCurrent ? ' í röðina' : ''}`
                : `Veldu bjóra til að bæta við (${filteredBeers.length} tiltæk${filteredBeers.length !== 1 ? 'ir' : 'ur'})`
              }
            </button>
          </div>
        ) : (
          /* Custom Mode */
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="customName" className="block text-sm font-medium mb-1.5">
                  Nafn bjórs <span className="text-destructive">*</span>
                </label>
                <input
                  id="customName"
                  type="text"
                  placeholder="t.d., Winter Warmer"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="customBrewery" className="block text-sm font-medium mb-1.5">
                  Brugghús <span className="text-destructive">*</span>
                </label>
                <input
                  id="customBrewery"
                  type="text"
                  placeholder="t.d., Staðbundið brugghús"
                  value={customBrewery}
                  onChange={(e) => setCustomBrewery(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="customStyle" className="block text-sm font-medium mb-1.5">
                  Stíll (valfrjálst)
                </label>
                <input
                  id="customStyle"
                  type="text"
                  placeholder="t.d., IPA, Stout"
                  value={customStyle}
                  onChange={(e) => setCustomStyle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="customAbv" className="block text-sm font-medium mb-1.5">
                  ABV % (valfrjálst)
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

              <div>
                <label htmlFor="customProductNumber" className="block text-sm font-medium mb-1.5">
                  Vínbúðin vörunúmer (valfrjálst)
                </label>
                <input
                  id="customProductNumber"
                  type="text"
                  placeholder="e.g., 20821"
                  value={customProductNumber}
                  onChange={(e) => setCustomProductNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Býr til mynd sjálfkrafa frá Vínbúðinni ef gefið upp
                </p>
              </div>
            </div>

            {makeCurrentButton}

            <button
              type="submit"
              disabled={!customName || !customBrewery}
              className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Bæta við sérsniðnum bjór
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
