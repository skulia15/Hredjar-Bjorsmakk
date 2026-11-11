import webpush from 'web-push'
import { prisma } from './prisma'

let configured: boolean | undefined

/**
 * Push is optional: without VAPID keys the app works as before, nudging only open screens
 */
function configure(): boolean {
  if (configured !== undefined) return configured
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  configured = Boolean(publicKey && privateKey && subject)
  if (configured) webpush.setVapidDetails(subject!, publicKey!, privateKey!)
  return configured
}

export interface PushPayload {
  title: string
  body: string
  /** Opened when the notification is tapped */
  url: string
  /** A newer notification with the same tag replaces the old one instead of stacking */
  tag: string
}

/**
 * Push to every device of the users behind these participants. Never throws: a nudge still
 * reaches open screens through polling if push fails. Subscriptions the push service says are
 * gone (404/410) are deleted.
 */
export async function pushToParticipants(participantIds: string[], payload: PushPayload): Promise<number> {
  if (participantIds.length === 0 || !configure()) return 0

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { user: { participations: { some: { id: { in: participantIds } } } } },
    })

    const body = JSON.stringify(payload)
    const results = await Promise.allSettled(subscriptions.map(subscription =>
      webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        body,
        // A nudge is only worth anything while the beer is still being rated
        { TTL: 120, urgency: 'high', timeout: 5000 }
      )
    ))

    const gone: string[] = []
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') return
      const statusCode = (result.reason as { statusCode?: number } | null)?.statusCode
      if (statusCode === 404 || statusCode === 410) gone.push(subscriptions[i].id)
      else console.error('[Push] Send failed:', result.reason)
    })
    if (gone.length > 0) {
      await prisma.pushSubscription.deleteMany({ where: { id: { in: gone } } })
    }

    return results.filter(result => result.status === 'fulfilled').length
  } catch (error) {
    console.error('[Push] Nudge push failed:', error)
    return 0
  }
}
