import webpush, { PushSubscription as WebPushSubscription } from 'web-push'
import PushSubscription from '@/models/PushSubscription'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
  } catch {}
}

export interface PushPayload {
  title: string
  body?: string
  url?: string
  icon?: string
  data?: Record<string, unknown>
}

export async function sendPushToUser(userEmail: string, payload: PushPayload) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return
  const subs = await PushSubscription.find({ userEmail })
  const data = JSON.stringify(payload)
  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys } as unknown as WebPushSubscription, data)
    } catch (e: unknown) {
      // Clean up invalid subscriptions
      const err = e as { statusCode?: number }
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await PushSubscription.deleteOne({ endpoint: sub.endpoint })
      }
    }
  }))
}
