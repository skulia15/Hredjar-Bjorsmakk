// Vínbúðin product shots are JPGs on white. We serve them through /api/beer-image,
// which cuts the white away so the bottle sits on whatever colour is behind it.

const VINBUDIN_IMAGE = /^https:\/\/www\.vinbudin\.is\/Portaldata\/1\/Resources\/vorumyndir\/medium\/(\d+)_r\.jpg$/

export function vinbudinImageUrl(productNumber: string) {
  return `https://www.vinbudin.is/Portaldata/1/Resources/vorumyndir/medium/${productNumber}_r.jpg`
}

// Custom (non-Vínbúðin) image URLs are left alone
export function beerImageSrc(imageUrl: string) {
  const productNumber = imageUrl.match(VINBUDIN_IMAGE)?.[1]
  return productNumber ? `/api/beer-image/${productNumber}` : imageUrl
}

// Near-white and unsaturated, with headroom for JPEG noise
const BG_MIN = 232
const BG_MAX_SPREAD = 18
// Edge pixels lighter than this fade out, softening the cut
const FEATHER_FROM = 160

/**
 * Alpha mask that removes the white background: a flood fill from the image
 * border, so white *inside* the bottle (labels, a white can) stays opaque.
 */
export function backgroundAlpha(pixels: Uint8Array, width: number, height: number, channels: number) {
  const count = width * height
  const lightness = new Uint8Array(count)
  const isBg = new Uint8Array(count)
  for (let p = 0; p < count; p++) {
    const i = p * channels
    const min = Math.min(pixels[i], pixels[i + 1], pixels[i + 2])
    const max = Math.max(pixels[i], pixels[i + 1], pixels[i + 2])
    lightness[p] = min
    isBg[p] = min >= BG_MIN && max - min <= BG_MAX_SPREAD ? 1 : 0
  }

  const removed = new Uint8Array(count)
  const stack: number[] = []
  const visit = (p: number) => {
    if (isBg[p] && !removed[p]) {
      removed[p] = 1
      stack.push(p)
    }
  }
  for (let x = 0; x < width; x++) {
    visit(x)
    visit((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    visit(y * width)
    visit(y * width + width - 1)
  }
  while (stack.length) {
    const p = stack.pop() as number
    const x = p % width
    if (x > 0) visit(p - 1)
    if (x < width - 1) visit(p + 1)
    if (p >= width) visit(p - width)
    if (p < count - width) visit(p + width)
  }

  const alpha = new Uint8Array(count).fill(255)
  for (let p = 0; p < count; p++) {
    if (removed[p]) {
      alpha[p] = 0
      continue
    }
    const x = p % width
    const touchesBg =
      (x > 0 && removed[p - 1]) ||
      (x < width - 1 && removed[p + 1]) ||
      (p >= width && removed[p - width]) ||
      (p < count - width && removed[p + width])
    if (touchesBg && lightness[p] > FEATHER_FROM) {
      alpha[p] = Math.round((255 * (255 - lightness[p])) / (255 - FEATHER_FROM))
    }
  }
  return alpha
}
