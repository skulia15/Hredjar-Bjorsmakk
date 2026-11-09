import { describe, expect, it } from 'vitest'
import { tastingBeerPrice } from './tastingPrice'
import { isIcelandic } from './countries'

describe('tastingBeerPrice', () => {
  const catalog = { priceISK: 699, pricePerLiter: 2118 }

  it('keeps the snapshot over the catalog', () => {
    const tb = { priceISK: 599, pricePerLiter: 1815, beer: catalog }
    expect(tastingBeerPrice(tb, 'active')).toEqual({ priceISK: 599, pricePerLiter: 1815 })
    expect(tastingBeerPrice(tb, 'closed')).toEqual({ priceISK: 599, pricePerLiter: 1815 })
  })

  it('fills gaps from the catalog while open, field by field', () => {
    const tb = { priceISK: 599, pricePerLiter: null, beer: catalog }
    expect(tastingBeerPrice(tb, 'active')).toEqual({ priceISK: 599, pricePerLiter: 2118 })
  })

  it('never reads the catalog once closed', () => {
    const tb = { priceISK: null, pricePerLiter: null, beer: catalog }
    expect(tastingBeerPrice(tb, 'closed')).toEqual({ priceISK: null, pricePerLiter: null })
  })

  it('copes with a custom beer that has no catalog row', () => {
    expect(tastingBeerPrice({ priceISK: null, pricePerLiter: null, beer: null }, 'active')).toEqual({ priceISK: null, pricePerLiter: null })
  })
})

describe('isIcelandic', () => {
  it('takes both spellings the catalog has', () => {
    expect(isIcelandic('Ísland')).toBe(true)
    expect(isIcelandic('Iceland')).toBe(true)
    expect(isIcelandic('Danmörk')).toBe(false)
    expect(isIcelandic(null)).toBe(false)
  })
})
