import { randomUUID } from 'node:crypto'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

const jar = new Map<string, string>()

// Minimal stand-in for the next/headers cookie store
export const cookieStore = {
  get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
  set: (name: string, value: string) => {
    jar.set(name, value)
  },
  delete: (name: string) => {
    jar.delete(name)
  },
}

export function resetCookies() {
  jar.clear()
}

export function setCookie(name: string, value: string) {
  jar.set(name, value)
}

export function getCookie(name: string) {
  return jar.get(name)
}

type Handler<P> = (request: NextRequest, context: { params: Promise<P> }) => Promise<Response>

/**
 * Invoke a route handler the way Next does and return status + parsed JSON
 */
export async function callRoute<P extends Record<string, string>>(
  handler: Handler<P>,
  { params, body, method = 'GET', path = '/' }: { params: P; body?: unknown; method?: string; path?: string }
) {
  const request = new NextRequest(new URL(path, 'http://localhost'), {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const response = await handler(request, { params: Promise.resolve(params) })
  const contentType = response.headers.get('content-type') ?? ''
  const json = contentType.includes('application/json') ? await response.json() : null
  return { status: response.status, json, response }
}

/**
 * An active tasting with a leader, some participants and untasted beers
 */
export async function createTastingFixture({
  participantNames = ['anna', 'bjarni', 'gunna'],
  beerCount = 3,
}: { participantNames?: string[]; beerCount?: number } = {}) {
  const leader = await prisma.user.create({ data: { name: 'leader', isLeader: true } })
  const tasting = await prisma.tasting.create({
    data: { title: 'Test tasting', status: 'active', createdBy: leader.id },
  })

  const participants = []
  for (const [index, name] of participantNames.entries()) {
    const user = await prisma.user.create({ data: { name } })
    participants.push(
      await prisma.participant.create({
        data: { tastingId: tasting.id, userId: user.id, code: `P${index}00`, rejoinToken: randomUUID() },
      })
    )
  }

  const beers = []
  for (let index = 0; index < beerCount; index++) {
    beers.push(
      await prisma.tastingBeer.create({
        data: { tastingId: tasting.id, customName: `Beer ${index + 1}`, customBrewery: 'Brewery', orderIndex: index },
      })
    )
  }

  return { leader, tasting, participants, beers }
}
