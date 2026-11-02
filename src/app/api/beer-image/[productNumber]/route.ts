import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { backgroundAlpha, vinbudinImageUrl } from '@/lib/beerImage'

// Product images don't change, so the CDN keeps the cutout and this rarely runs
const CACHE = 'public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400'

export async function GET(_request: Request, { params }: { params: Promise<{ productNumber: string }> }) {
  const { productNumber } = await params
  if (!/^\d{1,10}$/.test(productNumber)) {
    return new NextResponse(null, { status: 404 })
  }

  const upstream = await fetch(vinbudinImageUrl(productNumber))
  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status === 404 ? 404 : 502 })
  }

  // Vínbúðin answers unknown products with an empty 200
  const original = Buffer.from(await upstream.arrayBuffer())
  if (original.length === 0) {
    return new NextResponse(null, { status: 404 })
  }

  try {
    const { data, info } = await sharp(original)
      .removeAlpha()
      .toColourspace('srgb')
      .raw()
      .toBuffer({ resolveWithObject: true })
    const alpha = backgroundAlpha(data, info.width, info.height, info.channels)
    const image = await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
      .joinChannel(Buffer.from(alpha), { raw: { width: info.width, height: info.height, channels: 1 } })
      .webp({ quality: 90, alphaQuality: 100 })
      .toBuffer()

    return new NextResponse(new Uint8Array(image), {
      headers: { 'Content-Type': 'image/webp', 'Cache-Control': CACHE },
    })
  } catch (error) {
    console.error('Beer image cutout failed:', productNumber, error)
    return new NextResponse(null, { status: 502 })
  }
}
