import { describe, expect, it } from 'vitest'
import { backgroundAlpha, beerImageSrc, vinbudinImageUrl } from './beerImage'

const W = 0xff // white
const D = 0x20 // dark

// 5x5 RGB image from a grid of grey levels
function image(rows: number[][]) {
  return new Uint8Array(rows.flat().flatMap((v) => [v, v, v]))
}

describe('backgroundAlpha', () => {
  it('clears white connected to the border, keeps white enclosed by the bottle', () => {
    const pixels = image([
      [W, W, W, W, W],
      [W, D, D, D, W],
      [W, D, W, D, W],
      [W, D, D, D, W],
      [W, W, W, W, W],
    ])
    const alpha = Array.from(backgroundAlpha(pixels, 5, 5, 3))
    expect(alpha).toEqual([
      0, 0, 0, 0, 0,
      0, 255, 255, 255, 0,
      0, 255, 255, 255, 0,
      0, 255, 255, 255, 0,
      0, 0, 0, 0, 0,
    ])
  })

  it('keeps saturated light colours', () => {
    // Pale yellow: light, but not white
    const pixels = new Uint8Array([255, 245, 180])
    expect(Array.from(backgroundAlpha(pixels, 1, 1, 3))).toEqual([255])
  })

  it('fades light edge pixels next to the cut', () => {
    const pixels = image([[W, 0xd0, D]])
    const [bg, edge, inner] = backgroundAlpha(pixels, 3, 1, 3)
    expect(bg).toBe(0)
    expect(edge).toBeGreaterThan(0)
    expect(edge).toBeLessThan(255)
    expect(inner).toBe(255)
  })
})

describe('beerImageSrc', () => {
  it('routes Vínbúðin images through the cutout', () => {
    expect(beerImageSrc(vinbudinImageUrl('26259'))).toBe('/api/beer-image/26259')
  })

  it('leaves other URLs alone', () => {
    expect(beerImageSrc('https://example.com/beer.jpg')).toBe('https://example.com/beer.jpg')
  })
})
