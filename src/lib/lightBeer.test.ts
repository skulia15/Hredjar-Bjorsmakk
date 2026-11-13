import { describe, expect, it } from 'vitest'
import { isLightBeer } from './lightBeer'

describe('isLightBeer', () => {
  it('finds Lite, Light and Létt in the name, any case', () => {
    expect(isLightBeer('Gull Lite White Ale Jól')).toBe(true)
    expect(isLightBeer('Víking Lite Jól')).toBe(true)
    expect(isLightBeer('Christmas Light')).toBe(true)
    expect(isLightBeer('Léttöl jólabjór')).toBe(true)
    expect(isLightBeer('LITE')).toBe(true)
  })

  it('leaves out words that only contain it', () => {
    expect(isLightBeer('Jólabolla Imperial Stout')).toBe(false)
    expect(isLightBeer('Turkish Delight Porter')).toBe(false)
    expect(isLightBeer('Satellite IPA')).toBe(false)
  })
})
