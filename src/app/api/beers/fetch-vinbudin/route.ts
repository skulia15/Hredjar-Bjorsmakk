import { NextResponse } from 'next/server'

/**
 * POST /api/beers/fetch-vinbudin
 *
 * NOTE: This endpoint doesn't work in production because Vínbúðin loads products
 * dynamically with JavaScript. Use the local script instead:
 *
 * npx tsx scripts/fetch-vinbudin-beers.ts
 *
 * See scripts/fetch-vinbudin-beers.ts for more information.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Þessi aðgerð virkar ekki á vefnum',
      message: 'Vínbúðin hleður vörum með JavaScript. Notaðu local script í staðinn:\n\nnpx tsx scripts/fetch-vinbudin-beers.ts\n\nSjá scripts/fetch-vinbudin-beers.ts fyrir frekari upplýsingar.',
      note: 'This endpoint does not work in production because Vínbúðin loads products dynamically with JavaScript. Use the local script: scripts/fetch-vinbudin-beers.ts'
    },
    { status: 501 }
  )
}
