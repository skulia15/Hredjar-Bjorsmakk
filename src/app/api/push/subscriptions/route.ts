import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authErrorResponse, requireUser } from '@/lib/auth'
import { isPushServiceEndpoint } from '@/lib/pushEndpoint'

const subscriptionSchema = z.object({
  endpoint: z.string().max(2048).refine(isPushServiceEndpoint, 'Not a push service endpoint'),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(256),
  }),
})

const unsubscribeSchema = z.object({
  endpoint: z.string().max(2048),
})

/**
 * POST /api/push/subscriptions
 * Save this device's push subscription for the signed-in user. Idempotent: the client re-sends it
 * on every visit, which also moves a shared device over to whoever is signed in now.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser()
    const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }
    const { endpoint, keys } = parsed.data

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
      update: { p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Error saving push subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/push/subscriptions
 * Stop pushing to this device. Only removes the signed-in user's own subscription.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser()
    const parsed = unsubscribeSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    await prisma.pushSubscription.deleteMany({
      where: { endpoint: parsed.data.endpoint, userId: user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const authResponse = authErrorResponse(error)
    if (authResponse) return authResponse

    console.error('Error deleting push subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
